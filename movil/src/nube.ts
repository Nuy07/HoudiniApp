// Comunicación con el servidor Python: cuenta, respaldo cifrado, tienda y tiempo real.
import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import Constants from 'expo-constants';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import * as db from './db';
import { cambio } from './estado';

export type Alerta = { id: number; de: string; mensaje: string; lat: number | null; lng: number | null; creada: number };
export type Evento = ({ tipo: 'alerta' } & Alerta) | { tipo: 'solicitud' | 'aceptado'; de: string } | { tipo: 'listo' };
type Sesion = { usuario: string; token: string; clave: string };

let sesion: Sesion | null = null;
let socket: WebSocket | null = null;
let enLineaAhora = false;
let reintento = 1000;
let relojReintento: ReturnType<typeof setTimeout>;
let alRecibir: (e: Evento) => void = () => {};

export const usuario = () => sesion?.usuario ?? null;
export const enLinea = () => enLineaAhora;

// ---------- Dirección del servidor ----------
// En desarrollo es la misma computadora que corre Expo; se puede cambiar en Configuración.
function servidorAutomatico() {
  if (process.env.EXPO_PUBLIC_SERVIDOR) return process.env.EXPO_PUBLIC_SERVIDOR.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:8000`;
}
export const servidor = () => db.config('servidor') || servidorAutomatico();
export function cambiarServidor(url: string) {
  const limpia = url.trim().replace(/\/+$/, '');
  if (limpia && !/^https?:\/\/[^\s/]+$/.test(limpia)) throw new Error('Usa el formato http://192.168.1.10:8000');
  db.ponerConfig('servidor', limpia);
  reconectar();
}

// ---------- API ----------
type Opciones = { metodo?: string; datos?: unknown };
export async function api<T = unknown>(ruta: string, { metodo = 'GET', datos }: Opciones = {}): Promise<T> {
  const corte = new AbortController();
  const limite = setTimeout(() => corte.abort(), 10000);
  const token = sesion?.token;
  let r: Response;
  let texto: string;
  try {
    r = await fetch(`${servidor()}/api${ruta}`, {
      method: metodo,
      signal: corte.signal,
      headers: {
        ...(datos !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: datos === undefined ? undefined : JSON.stringify(datos),
    });
    texto = await r.text();
  } catch {
    throw new Error('Sin conexión con el servidor. Las funciones locales siguen activas.');
  } finally { clearTimeout(limite); }

  let j: any = null;
  try { j = texto ? JSON.parse(texto) : null; } catch { /* respuesta que no es JSON */ }
  if (r.status === 401 && token && token === sesion?.token) await olvidar();
  if (!r.ok) throw new Error(j?.error ?? 'Error del servidor.');
  return j as T;
}

// ---------- Cuenta ----------
// De la contraseña salen DOS claves distintas: una para entrar y otra para cifrar.
// El servidor solo conoce la primera, por eso no puede leer tu respaldo.
async function derivar(nombre: string, contrasena: string) {
  const bits = await scryptAsync(utf8ToBytes(contrasena.normalize('NFKC')), utf8ToBytes(`houdini:${nombre}`),
    { N: 2 ** 14, r: 8, p: 1, dkLen: 64 });
  return { acceso: bytesToHex(bits.slice(0, 32)), cifrado: bytesToHex(bits.slice(32)) };
}
export async function entrar(modo: 'login' | 'registro', nombre: string, contrasena: string) {
  const u = nombre.trim().toLowerCase();
  if (contrasena.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  const { acceso, cifrado } = await derivar(u, contrasena);
  const r = await api<{ usuario: string; token: string }>(`/${modo}`, { metodo: 'POST', datos: { usuario: u, clave: acceso } });
  sesion = { usuario: r.usuario, token: r.token, clave: cifrado };
  await SecureStore.setItemAsync('sesion', JSON.stringify(sesion));
  reconectar();
}
async function olvidar() {
  sesion = null;
  cerrarSocket();
  await SecureStore.deleteItemAsync('sesion');
  cambio();
}
export async function salir() {
  await api('/salir', { metodo: 'POST' }).catch(() => {});
  await olvidar();
}
export async function borrarCuenta() {
  await api('/cuenta', { metodo: 'DELETE' });
  await olvidar();
}

// ---------- Respaldo cifrado de extremo a extremo (AES-GCM) ----------
function aB64(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
const deB64 = (t: string) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));

function laSesion() {
  if (!sesion) throw new Error('Inicia sesión primero.');
  return sesion;
}
export async function respaldar() {
  const clave = hexToBytes(laSesion().clave);
  const iv = getRandomBytes(12);
  const datos = gcm(clave, iv).encrypt(utf8ToBytes(JSON.stringify(db.exportar())));
  await api('/respaldo', { metodo: 'PUT', datos: { iv: aB64(iv), datos: aB64(datos) } });
}
export async function recuperar() {
  const clave = hexToBytes(laSesion().clave);
  const r = await api<{ iv: string; datos: string }>('/respaldo');
  let claro: Uint8Array;
  try { claro = gcm(clave, deB64(r.iv)).decrypt(deB64(r.datos)); } catch { throw new Error('No se pudo descifrar el respaldo.'); }
  db.importar(JSON.parse(new TextDecoder().decode(claro)));
}

// ---------- Tiempo real ----------
function cerrarSocket() {
  clearTimeout(relojReintento);
  const ws = socket;
  socket = null;
  enLineaAhora = false;
  ws?.close();
}
function reconectar() {
  cerrarSocket();
  reintento = 1000;
  conectar();
  cambio();
}
function conectar() {
  clearTimeout(relojReintento);
  if (!sesion || socket) return;
  const ws = new WebSocket(`${servidor().replace(/^http/, 'ws')}/tiempo-real`);
  socket = ws;
  ws.onopen = () => ws.send(JSON.stringify({ tipo: 'auth', token: sesion?.token }));
  ws.onmessage = ({ data }) => {
    if (socket !== ws) return;
    const m = JSON.parse(data) as Evento;
    if (m.tipo === 'listo') { reintento = 1000; enLineaAhora = true; }
    if (m.tipo === 'alerta') ws.send(JSON.stringify({ tipo: 'recibida', id: m.id }));
    alRecibir(m);
    cambio();
  };
  ws.onclose = ({ code }) => {
    if (socket !== ws) return;
    socket = null;
    enLineaAhora = false;
    cambio();
    if (code === 4001) {
      // Sesión vencida o cuenta borrada: la API responde 401 y se cierra la sesión local.
      api('/complices').catch(() => {});
      return;
    }
    relojReintento = setTimeout(conectar, reintento);
    reintento = Math.min(reintento * 2, 30000);
  };
}

export async function iniciar(oyente: (e: Evento) => void) {
  alRecibir = oyente;
  try { sesion = JSON.parse((await SecureStore.getItemAsync('sesion')) ?? 'null'); } catch { sesion = null; }
  // Al volver a la app el socket puede estar muerto sin avisar: se abre uno nuevo.
  let fuera = false;
  AppState.addEventListener('change', (s) => {
    if (s === 'background') fuera = true;
    if (s === 'active' && fuera) { fuera = false; reconectar(); }
  });
  conectar();
}
