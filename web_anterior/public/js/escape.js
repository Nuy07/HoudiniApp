// Los escapes: llamada falsa adaptativa y bomba de notificaciones.
import * as db from './db.js';
import { h, icono, aviso } from './ui.js';

let audio;
let activo = null; // { tipo, cerrar } del escape en curso

// El navegador exige un toque del usuario antes de permitir sonido.
export function prepararAudio() {
  audio ??= new AudioContext();
  if (audio.state === 'suspended') audio.resume();
}
document.addEventListener('pointerdown', prepararAudio);

export function vibrar(patron) {
  if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(patron);
}
function nota(frecuencia, inicio, duracion, volumen = 0.15) {
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.frequency.value = frecuencia;
  g.gain.setValueAtTime(volumen, audio.currentTime + inicio);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + inicio + duracion);
  o.connect(g).connect(audio.destination);
  o.start(audio.currentTime + inicio);
  o.stop(audio.currentTime + inicio + duracion);
}
function tono() {
  const sonar = () => {
    if (audio?.state === 'running') [660, 880, 660, 880, 990].forEach((f, i) => nota(f, i * 0.18, 0.3));
    vibrar([600, 300, 600]);
  };
  sonar();
  const t = setInterval(sonar, 2200);
  return () => { clearInterval(t); vibrar(0); };
}

export function sistema() {
  const elegido = db.config('estilo', 'auto');
  if (elegido !== 'auto') return elegido;
  return /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'ios' : 'android';
}

function registrar(tipo, gatillo, detalle) {
  db.ejecutar('INSERT INTO historial (tipo, gatillo, detalle) VALUES (?, ?, ?)', [tipo, gatillo, detalle]);
  document.dispatchEvent(new Event('historial'));
}

// ---------- Llamada falsa ----------
export function llamada(gatillo, perfilId) {
  if (activo?.tipo === 'llamada') return false;
  activo?.cerrar(); // una llamada tiene prioridad sobre una bomba
  const base = `SELECT p.id, p.nombre, p.etiqueta, v.rate, v.pitch, v.guion
    FROM perfiles p LEFT JOIN voces v ON v.id = p.voz_id`;
  const p = db.uno(`${base} WHERE p.id = ?`, [Number(perfilId ?? db.config('perfil', 0))])
    ?? db.uno(`${base} ORDER BY p.id LIMIT 1`);
  if (!p) { aviso('Crea un perfil primero.'); return false; }
  registrar('llamada', gatillo, p.nombre);

  const estilo = sistema();
  const pararTono = tono();
  let pararVoz = () => {};
  let contador;
  const estado = h('p', { class: 'll-estado' }, estilo === 'ios' ? p.etiqueta.toLowerCase() : 'Llamada entrante');

  const cerrar = () => {
    pararTono(); pararVoz(); clearInterval(contador);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    pantalla.remove();
    activo = null;
  };
  const boton = (clase, texto, fn, ico = true) =>
    h('button', { class: `ll-boton ${clase}`, onclick: fn }, h('span', {}, ico ? icono('tel') : texto[0]), texto);

  const acciones = h('div', { class: 'll-acciones' },
    boton('rechazar', 'Rechazar', cerrar),
    boton('aceptar', estilo === 'ios' ? 'Aceptar' : 'Contestar', contestar));

  const pantalla = h('section', { class: `llamada ${estilo}`, role: 'dialog', 'aria-label': `Llamada de ${p.nombre}` },
    h('div', { class: 'll-quien' },
      h('div', { class: 'll-avatar' }, p.nombre.trim()[0]?.toUpperCase() ?? '?'),
      h('h2', {}, p.nombre), estado),
    acciones);

  function contestar() {
    pararTono();
    const t0 = Date.now();
    const pintar = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      estado.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    pintar();
    contador = setInterval(pintar, 1000);
    const alternar = (texto) => {
      const b = boton('menor', texto, () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')), false);
      b.setAttribute('aria-pressed', 'false');
      return b;
    };
    acciones.replaceChildren(
      h('div', { class: 'll-extras' }, alternar('Silenciar'), alternar('Teclado'), alternar('Altavoz')),
      boton('rechazar', 'Colgar', cerrar));
    pararVoz = hablar(p, pantalla);
  }

  activo = { tipo: 'llamada', cerrar };
  document.body.append(pantalla);
  pantalla.requestFullscreen?.().catch(() => {}); // solo funciona si hubo un toque
  return true;
}

// Voz con "audio por proximidad": espera a que lleves el teléfono al oído.
// La web no da acceso al sensor de proximidad; se usa la inclinación.
function hablar(p, pantalla) {
  let vivo = true;
  let iniciado = false;
  let espera;
  const guion = JSON.parse(p.guion ?? '["Hola, ¿puedes hablar?"]');

  function decir(i) {
    if (!vivo || i >= guion.length || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(guion[i]);
    u.lang = 'es-MX';
    u.rate = p.rate ?? 1;
    u.pitch = p.pitch ?? 1;
    const v = speechSynthesis.getVoices();
    u.voice = v.find((x) => x.lang === 'es-MX') ?? v.find((x) => x.lang.startsWith('es')) ?? null;
    u.onend = () => { espera = setTimeout(() => decir(i + 1), 2500); };
    speechSynthesis.speak(u);
  }
  const empezar = () => { if (!iniciado && vivo) { iniciado = true; espera = setTimeout(() => decir(0), 700); } };

  let haySensor = false;
  const orientacion = (e) => {
    if (e.beta == null) return;
    haySensor = true;
    const oido = Math.abs(e.gamma) > 55 || (e.beta > 70 && e.beta < 120);
    pantalla.classList.toggle('en-oido', oido);
    if (oido) empezar();
  };
  let respaldo;
  if (db.config('proximidad', '1') === '1') {
    addEventListener('deviceorientation', orientacion);
    respaldo = setTimeout(() => { if (!haySensor) empezar(); }, 1500); // sin sensor (PC): habla directo
  } else empezar();

  return () => {
    vivo = false;
    clearTimeout(espera); clearTimeout(respaldo);
    removeEventListener('deviceorientation', orientacion);
    window.speechSynthesis?.cancel();
  };
}

// ---------- Bomba de notificaciones ----------
export function bomba(gatillo, bombaId) {
  if (activo) return false;
  const b = db.uno('SELECT * FROM bombas WHERE id = ?', [Number(bombaId ?? db.config('bomba', 0))])
    ?? db.uno('SELECT * FROM bombas ORDER BY id LIMIT 1');
  if (!b) { aviso('Crea una bomba de notificaciones primero.'); return false; }
  registrar('bomba', gatillo, b.nombre);
  const mensajes = JSON.parse(b.mensajes);
  const zona = h('div', { class: 'burbujas', 'aria-live': 'assertive' });
  document.body.append(zona);
  const relojes = mensajes.map((m, i) => setTimeout(() => {
    if (audio?.state === 'running') { nota(1175, 0, 0.12); nota(1568, 0.12, 0.2); }
    vibrar(200);
    const nodo = h('article', { class: 'burbuja', onclick: () => nodo.remove() },
      h('span', { class: 'punto' }, m.de[0] ?? '?'),
      h('div', {}, h('strong', {}, m.de), h('p', {}, m.texto)), h('small', {}, 'ahora'));
    zona.prepend(nodo);
    setTimeout(() => nodo.remove(), 7000);
    notificar(m.de, m.texto, `bomba-${i}`);
  }, i * 1300));
  const cerrar = () => { relojes.forEach(clearTimeout); zona.remove(); activo = null; };
  const este = activo = { tipo: 'bomba', cerrar };
  setTimeout(() => { if (activo === este) cerrar(); }, mensajes.length * 1300 + 7000);
  return true;
}

// Notificación del sistema (si el usuario dio permiso).
export async function notificar(titulo, cuerpo, tag) {
  if (globalThis.Notification?.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  reg?.showNotification(titulo, { body: cuerpo, tag, icon: 'icono.svg' }).catch(() => {});
}

export function lanzar(accion, gatillo) {
  return accion === 'bomba' ? bomba(gatillo) : llamada(gatillo);
}
