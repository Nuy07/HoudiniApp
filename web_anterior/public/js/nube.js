// Comunicación con el servidor: cuenta, respaldo cifrado, tienda y tiempo real.
import * as db from './db.js';

let sesion = null; // { usuario, token, clave }
let socket;
let reintento = 1000;

export const usuario = () => sesion?.usuario ?? null;

export async function api(ruta, { metodo = 'GET', datos } = {}) {
  let r;
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: {
        ...(datos && { 'Content-Type': 'application/json' }),
        ...(sesion && { Authorization: `Bearer ${sesion.token}` }),
      },
      body: datos && JSON.stringify(datos),
    });
  } catch { throw new Error('Sin conexión. Las funciones locales siguen activas.'); }
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && sesion) await olvidar();
  if (!r.ok) throw new Error(j.error ?? 'Error del servidor.');
  return j;
}

// De la contraseña salen DOS claves distintas: una para entrar y otra para cifrar.
// El servidor solo conoce la primera, por eso no puede leer tu respaldo.
async function derivar(nombre, contrasena) {
  if (!db.hayCifrado()) throw new Error('Las cuentas necesitan HTTPS o localhost.');
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(contrasena), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`houdini:${nombre}`), iterations: 600000 }, base, 512));
  const hex = [...bits.slice(0, 32)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const clave = await crypto.subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  return { hex, clave };
}

export async function entrar(modo, nombre, contrasena) {
  const u = nombre.trim().toLowerCase();
  if (contrasena.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  const { hex, clave } = await derivar(u, contrasena);
  const r = await api(`/${modo}`, { metodo: 'POST', datos: { usuario: u, clave: hex } });
  sesion = { usuario: r.usuario, token: r.token, clave };
  await db.guardar('sesion', sesion);
  conectar();
}
async function olvidar() {
  sesion = null;
  await db.borrar('sesion');
  socket?.close();
}
export async function salir() {
  await api('/salir', { metodo: 'POST' }).catch(() => {});
  await olvidar();
}
export async function borrarCuenta() {
  await api('/cuenta', { metodo: 'DELETE' });
  await olvidar();
}
export async function restaurarSesion() {
  sesion = (await db.leer('sesion')) ?? null;
  if (sesion) conectar();
}

// ---------- Respaldo cifrado de extremo a extremo ----------
const aB64 = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const deB64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));

export async function respaldar() {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const claro = new TextEncoder().encode(JSON.stringify(db.exportar()));
  const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sesion.clave, claro);
  await api('/respaldo', { metodo: 'PUT', datos: { iv: aB64(iv), datos: aB64(new Uint8Array(datos)) } });
}
export async function recuperar() {
  const r = await api('/respaldo');
  const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(r.iv) }, sesion.clave, deB64(r.datos));
  await db.importar(JSON.parse(new TextDecoder().decode(claro)));
}

// ---------- Tiempo real ----------
function conectar() {
  if (!sesion || (socket && socket.readyState < 2)) return;
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/tiempo-real`);
  socket = ws;
  ws.onopen = () => ws.send(JSON.stringify({ tipo: 'auth', token: sesion?.token }));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.tipo === 'listo') reintento = 1000;
    if (m.tipo === 'alerta') ws.send(JSON.stringify({ tipo: 'recibida', id: m.id }));
    document.dispatchEvent(new CustomEvent('tiempo-real', { detail: m }));
  };
  ws.onclose = (e) => {
    if (!sesion || e.code === 4001) return;
    setTimeout(conectar, reintento);
    reintento = Math.min(reintento * 2, 30000);
  };
}
addEventListener('online', conectar);
export const enLinea = () => socket?.readyState === 1;
