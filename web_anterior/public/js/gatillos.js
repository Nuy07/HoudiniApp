// Formas ocultas de activar un escape: teclas, agitar, modo discreto, GPS y temporizador.
import * as db from './db.js';
import { lanzar } from './escape.js';
import { h, aviso } from './ui.js';

const accion = () => db.config('accion', 'llamada');

// "n" eventos en menos de "ms" milisegundos.
function rafaga(n, ms, alCompletar) {
  let t = [];
  return () => {
    const ahora = Date.now();
    t = [...t.filter((x) => ahora - x < ms), ahora];
    if (t.length >= n) { t = []; alCompletar(); }
  };
}

// ---------- Botones de volumen / tecla V ----------
export function iniciarTeclas() {
  const contar = rafaga(3, 2000, () => lanzar(accion(), 'hardware'));
  addEventListener('keydown', (e) => {
    if (db.config('hardware', '1') !== '1' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target.closest?.('input, textarea, select, dialog')) return;
    if (['AudioVolumeUp', 'AudioVolumeDown', 'VolumeUp', 'VolumeDown'].includes(e.key) || e.key.toLowerCase() === 'v') contar();
  });
}

// ---------- Agitar ----------
const sacudida = rafaga(4, 1500, () => lanzar(accion(), 'agitar'));
let ultimo = 0;
function mover(e) {
  const a = e.accelerationIncludingGravity;
  if (!a || a.x == null) return;
  if (Math.hypot(a.x, a.y, a.z) > 24 && Date.now() - ultimo > 150) { ultimo = Date.now(); sacudida(); }
}
export async function activarAgitar(si) {
  removeEventListener('devicemotion', mover);
  if (!si) return true;
  // iOS pide permiso explícito para los sensores.
  for (const S of [globalThis.DeviceMotionEvent, globalThis.DeviceOrientationEvent]) {
    if (S?.requestPermission && (await S.requestPermission().catch(() => 'denied')) !== 'granted') return false;
  }
  addEventListener('devicemotion', mover);
  return true;
}

// ---------- Rescate discreto: pantalla negra que parece apagada ----------
export function discreto() {
  let candado;
  const bloquear = async () => { candado = await navigator.wakeLock?.request('screen').catch(() => null); };
  bloquear();
  const salir = () => {
    clearTimeout(largo);
    candado?.release();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    capa.remove();
  };
  const toque = rafaga(3, 1500, () => { salir(); lanzar(accion(), 'discreto'); });
  let largo;
  const capa = h('div', {
    class: 'negro', role: 'button', tabindex: '0',
    'aria-label': 'Modo discreto: tres toques activan el escape, mantener presionado sale',
    onpointerdown: () => { toque(); largo = setTimeout(salir, 1800); },
    onpointerup: () => clearTimeout(largo),
    onpointercancel: () => clearTimeout(largo),
    oncontextmenu: (e) => e.preventDefault(),
    onkeydown: (e) => { if (e.key === 'Escape') salir(); },
  }, h('p', {}, '3 toques activan el escape. Mantén presionado para salir.'));
  document.body.append(capa);
  capa.focus();
  capa.requestFullscreen?.().catch(() => {});
}

// ---------- Temporizador ----------
let temporizador;
export function programar(segundos) {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => lanzar(accion(), 'temporizador'), segundos * 1000);
  aviso(`Escape programado en ${segundos < 60 ? `${segundos} s` : `${segundos / 60} min`}.`);
}
export function cancelarProgramado() {
  clearTimeout(temporizador);
  aviso('Escape programado cancelado.');
}

// ---------- Reglas por GPS ----------
export function distancia(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180;
  const s = Math.sin(((bLat - aLat) * r) / 2) ** 2
    + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLng - aLng) * r) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(s)); // metros
}

let vigia = null;
const dentro = new Map(); // id de regla -> si ya estábamos dentro
export function evaluar(lat, lng) {
  for (const r of db.todos('SELECT * FROM reglas WHERE activa = 1')) {
    const d = distancia(lat, lng, r.lat, r.lng);
    const antes = dentro.get(r.id);
    // Se sale con 20% de margen para no rebotar en el borde.
    const ahora = antes ? d < r.radio * 1.2 : d <= r.radio;
    dentro.set(r.id, ahora);
    // Solo dispara al ENTRAR: abrir la app estando dentro no activa nada.
    if (antes === false && ahora) lanzar(r.accion, 'gps');
  }
}
export function olvidarRegla(id) { dentro.delete(id); }
export function vigilarGps() {
  const hay = db.uno('SELECT COUNT(*) AS n FROM reglas WHERE activa = 1').n > 0;
  if (hay && vigia === null && navigator.geolocation) {
    vigia = navigator.geolocation.watchPosition(
      (p) => evaluar(p.coords.latitude, p.coords.longitude),
      (e) => { if (e.code === 1) aviso('Sin permiso de ubicación, las reglas GPS no funcionan.'); },
      { enableHighAccuracy: true, maximumAge: 10000 });
  } else if (!hay && vigia !== null) {
    navigator.geolocation.clearWatch(vigia);
    vigia = null;
  }
}
export function ubicacion() {
  return new Promise((ok, mal) => {
    if (!navigator.geolocation) return mal(new Error('Este navegador no tiene ubicación.'));
    navigator.geolocation.getCurrentPosition((p) => ok(p.coords),
      () => mal(new Error('No se pudo obtener tu ubicación. Revisa el permiso.')),
      { enableHighAccuracy: true, timeout: 10000 });
  });
}
