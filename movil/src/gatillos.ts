// Formas de activar un escape: agitar, modo discreto, temporizador y GPS.
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { AppState } from 'react-native';
import * as db from './db';
import { lanzar, lanzarPreferido, perfilPredeterminado } from './escape';
import { aviso, cambio } from './estado';
import * as avisos from './notificaciones';

// "n" eventos en menos de "ms" milisegundos.
export function rafaga(n: number, ms: number, alCompletar: () => void) {
  let t: number[] = [];
  return () => {
    const ahora = Date.now();
    t = [...t.filter((x) => ahora - x < ms), ahora];
    if (t.length >= n) { t = []; alCompletar(); }
  };
}

// ---------- Agitar ----------
let oyeAgitar: { remove: () => void } | null = null;
export async function activarAgitar(si: boolean) {
  oyeAgitar?.remove();
  oyeAgitar = null;
  if (!si) return;
  if (!(await Accelerometer.isAvailableAsync())) throw new Error('Este teléfono no tiene acelerómetro.');
  if (!(await Accelerometer.requestPermissionsAsync()).granted) throw new Error('No se dio permiso a los sensores.');
  const sacudida = rafaga(4, 1500, () => lanzarPreferido('agitar'));
  let ultimo = 0;
  Accelerometer.setUpdateInterval(100);
  oyeAgitar = Accelerometer.addListener(({ x, y, z }) => {
    // Medido en g: en reposo vale 1.
    if (Math.hypot(x, y, z) > 2.2 && Date.now() - ultimo > 150) { ultimo = Date.now(); sacudida(); }
  });
}

// ---------- Rescate discreto ----------
let negro = false;
export const discretoActivo = () => negro;
export function discreto(si: boolean) { negro = si; cambio(); }

// ---------- Temporizador ----------
// Con la app abierta dispara un reloj; en segundo plano llega una notificación que abre la llamada.
let hora = 0;
let reloj: ReturnType<typeof setTimeout>;
export async function programar(segundos: number) {
  const conPermiso = await avisos.permiso(true);
  hora = Date.now() + segundos * 1000;
  clearTimeout(reloj);
  reloj = setTimeout(revisarProgramado, segundos * 1000);
  const p = perfilPredeterminado();
  await avisos.notificar('programado', p?.nombre ?? 'Llamada', 'Llamada entrante', 'programado', segundos);
  const cuando = segundos < 60 ? `${segundos} s` : `${segundos / 60} min`;
  aviso(`Escape programado en ${cuando}.${conPermiso ? '' : ' Sin permiso de notificaciones, deja la app abierta.'}`);
}
export function cancelarProgramado() {
  clearTimeout(reloj);
  hora = 0;
  avisos.cancelar('programado');
  aviso('Escape programado cancelado.');
}
function revisarProgramado() {
  if (!hora || Date.now() < hora - 500 || AppState.currentState !== 'active') return;
  dispararProgramado();
}
export function dispararProgramado() {
  clearTimeout(reloj);
  hora = 0;
  avisos.cancelar('programado');
  lanzarPreferido('temporizador');
}

// ---------- Reglas por GPS ----------
export function distancia(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180;
  const s = Math.sin(((bLat - aLat) * r) / 2) ** 2
    + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLng - aLng) * r) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(s)); // metros
}

let vigia: Location.LocationSubscription | null = null;
let turno = 0;
const dentro = new Map<number, boolean>(); // id de regla -> si ya estábamos dentro
export function evaluar(lat: number, lng: number) {
  for (const r of db.todos<db.Regla>('SELECT * FROM reglas WHERE activa = 1')) {
    const d = distancia(lat, lng, r.lat, r.lng);
    const antes = dentro.get(r.id);
    // Se sale con 20% de margen para no rebotar en el borde.
    const ahora = antes ? d < r.radio * 1.2 : d <= r.radio;
    dentro.set(r.id, ahora);
    // Solo dispara al ENTRAR: abrir la app estando dentro no activa nada.
    if (antes === false && ahora) lanzar(r.accion, 'gps');
  }
}
export const olvidarRegla = (id: number) => { dentro.delete(id); };
export const olvidarReglas = () => dentro.clear();

export async function vigilarGps() {
  const mio = ++turno;
  const hay = db.cuantos('reglas WHERE activa = 1') > 0;
  if (!hay) { vigia?.remove(); vigia = null; return; }
  if (vigia) return;
  if (!(await Location.requestForegroundPermissionsAsync()).granted) {
    return aviso('Sin permiso de ubicación, las reglas GPS no funcionan.');
  }
  const nuevo = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
    (p) => evaluar(p.coords.latitude, p.coords.longitude),
  );
  // Si mientras tanto hubo otro cambio, este vigía ya no sirve.
  if (mio !== turno || vigia) nuevo.remove();
  else vigia = nuevo;
}
export async function ubicacion() {
  if (!(await Location.requestForegroundPermissionsAsync()).granted) throw new Error('No se dio permiso de ubicación.');
  const corte = new Promise<never>((_, mal) => { setTimeout(() => mal(new Error('No se pudo obtener tu ubicación.')), 15000); });
  return (await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), corte])).coords;
}

export function iniciar() {
  AppState.addEventListener('change', (s) => { if (s === 'active') revisarProgramado(); });
  if (db.config('agitar', '0') === '1') activarAgitar(true).catch(() => {});
  vigilarGps().catch(() => {});
}
