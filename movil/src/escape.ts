// Los escapes: llamada falsa y bomba de notificaciones.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Keyboard, Platform, Vibration } from 'react-native';
import * as db from './db';
import { aviso, cambio } from './estado';
import * as avisos from './notificaciones';

export type DatosLlamada = { id: number; nombre: string; etiqueta: string; rate: number; pitch: number; guion: string[] };
export type Burbuja = db.Mensaje & { id: number };

let llamadaActiva: DatosLlamada | null = null;
let burbujas: Burbuja[] = [];
let detenerBomba: (() => void) | null = null;
let serie = 0;

export const llamadaActual = () => llamadaActiva;
export const burbujasActuales = () => burbujas;

// ---------- Sonido ----------
let tono: AudioPlayer;
let mensaje: AudioPlayer;
export function prepararAudio() {
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  tono = createAudioPlayer(require('../assets/tono.wav'));
  tono.loop = true;
  mensaje = createAudioPlayer(require('../assets/mensaje.wav'));
}
export function sonarTono() {
  tono.seekTo(0);
  tono.play();
  Vibration.vibrate([0, 600, 300, 600, 700], true);
}
export function pararTono() {
  tono.pause();
  Vibration.cancel();
}

export function sistema(): 'ios' | 'android' {
  const elegido = db.config('estilo', 'auto');
  if (elegido === 'ios' || elegido === 'android') return elegido;
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

// ---------- Llamada falsa ----------
type FilaPerfil = { id: number; nombre: string; etiqueta: string; rate: number | null; pitch: number | null; guion: string | null };
export function perfilPredeterminado(idPerfil?: number) {
  const base = `SELECT p.id, p.nombre, p.etiqueta, v.rate, v.pitch, v.guion
    FROM perfiles p LEFT JOIN voces v ON v.id = p.voz_id`;
  return db.uno<FilaPerfil>(`${base} WHERE p.id = ?`, [idPerfil ?? Number(db.config('perfil', '0'))])
    ?? db.uno<FilaPerfil>(`${base} ORDER BY p.id LIMIT 1`);
}
export function llamada(gatillo: string, idPerfil?: number) {
  if (llamadaActiva) return;
  detenerBomba?.(); // una llamada tiene prioridad sobre una bomba
  const p = perfilPredeterminado(idPerfil);
  if (!p) return aviso('Crea un perfil primero.');
  Keyboard.dismiss();
  llamadaActiva = {
    id: ++serie, nombre: p.nombre, etiqueta: p.etiqueta, rate: p.rate ?? 1, pitch: p.pitch ?? 1,
    guion: p.guion ? JSON.parse(p.guion) : ['Hola, ¿puedes hablar?'],
  };
  db.registrar('llamada', gatillo, p.nombre);
}
export function colgar() {
  llamadaActiva = null;
  cambio();
}

// ---------- Bomba de notificaciones ----------
const PAUSA = 1300;
const VISIBLE = 7000;
export function quitarBurbuja(id: number) {
  burbujas = burbujas.filter((b) => b.id !== id);
  cambio();
}
export function bomba(gatillo: string, idBomba?: number) {
  if (llamadaActiva || detenerBomba) return;
  const b = db.uno<db.Bomba>('SELECT * FROM bombas WHERE id = ?', [idBomba ?? Number(db.config('bomba', '0'))])
    ?? db.uno<db.Bomba>('SELECT * FROM bombas ORDER BY id LIMIT 1');
  if (!b) return aviso('Crea una bomba de notificaciones primero.');
  Keyboard.dismiss();
  db.registrar('bomba', gatillo, b.nombre);

  const mensajes: db.Mensaje[] = JSON.parse(b.mensajes);
  const relojes: ReturnType<typeof setTimeout>[] = [];
  mensajes.forEach((m, i) => {
    relojes.push(setTimeout(() => {
      const nueva = { ...m, id: ++serie };
      burbujas = [nueva, ...burbujas];
      mensaje.seekTo(0);
      mensaje.play();
      Vibration.vibrate(200);
      cambio();
      relojes.push(setTimeout(() => quitarBurbuja(nueva.id), VISIBLE));
    }, i * PAUSA));
    // Estas solo se ven si la app pasa a segundo plano.
    avisos.notificar(`bomba-${i}`, m.de, m.texto, 'bomba', Math.max(1, Math.round((i * PAUSA) / 1000))).catch(() => {});
  });
  const terminar = () => {
    relojes.forEach(clearTimeout);
    mensajes.forEach((_, i) => avisos.cancelar(`bomba-${i}`));
    burbujas = [];
    detenerBomba = null;
    cambio();
  };
  detenerBomba = terminar;
  relojes.push(setTimeout(terminar, mensajes.length * PAUSA + VISIBLE));
}

export function lanzar(accion: string, gatillo: string) {
  if (accion === 'bomba') bomba(gatillo);
  else llamada(gatillo);
}
export const lanzarPreferido = (gatillo: string) => lanzar(db.config('accion', 'llamada'), gatillo);
