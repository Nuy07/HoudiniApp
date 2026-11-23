// BASE DE DATOS 1: SQLITE LOCAL
// SQLite real dentro del navegador (sql.js). El archivo se guarda en IndexedDB,
// cifrado con AES-GCM, así que la app funciona 100% sin internet.

let db;
let bodega; // IndexedDB
let cola = Promise.resolve();

// ---------- IndexedDB como almacén clave/valor ----------
function abrirBodega() {
  return new Promise((ok, mal) => {
    const p = indexedDB.open('houdini', 1);
    p.onupgradeneeded = () => p.result.createObjectStore('kv');
    p.onsuccess = () => ok(p.result);
    p.onerror = () => mal(p.error);
  });
}
function kv(modo, accion) {
  return new Promise((ok, mal) => {
    const tx = bodega.transaction('kv', modo);
    const p = accion(tx.objectStore('kv'));
    tx.oncomplete = () => ok(p.result);
    tx.onerror = tx.onabort = () => mal(tx.error);
  });
}
export const leer = (k) => kv('readonly', (s) => s.get(k));
export const guardar = (k, v) => kv('readwrite', (s) => s.put(v, k));
export const borrar = (k) => kv('readwrite', (s) => s.delete(k));

// ---------- Cifrado del archivo ----------
export const hayCifrado = () => Boolean(globalThis.crypto?.subtle); // solo en https o localhost

async function claveLocal() {
  let k = await leer('clave');
  if (!k) {
    // "false" = no exportable: ni la propia app puede leer la clave.
    k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await guardar('clave', k);
  }
  return k;
}

async function persistir() {
  const bytes = db.export();
  if (config('cifrado', '1') === '1' && hayCifrado()) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await claveLocal(), bytes);
    await guardar('sqlite', { iv, datos });
  } else {
    await guardar('sqlite', { datos: bytes });
  }
}
function programarGuardado() {
  cola = cola.then(persistir).catch((e) => console.error('No se pudo guardar la base local', e));
  return cola;
}

async function cargarBytes() {
  const f = await leer('sqlite');
  if (!f) return null;
  if (!f.iv) return new Uint8Array(f.datos);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: f.iv }, await claveLocal(), f.datos));
}

// ---------- Consultas ----------
export function todos(sql, params = []) {
  const st = db.prepare(sql);
  try {
    st.bind(params);
    const filas = [];
    while (st.step()) filas.push(st.getAsObject());
    return filas;
  } finally { st.free(); }
}
export const uno = (sql, params) => todos(sql, params)[0];
export function ejecutar(sql, params = []) {
  db.run(sql, params);
  const id = uno('SELECT last_insert_rowid() AS id').id;
  programarGuardado();
  return id;
}
export function config(clave, defecto = '') {
  return uno('SELECT valor FROM config WHERE clave = ?', [clave])?.valor ?? defecto;
}
export function ponerConfig(clave, valor) {
  ejecutar('INSERT INTO config VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', [clave, String(valor)]);
  return cola;
}

// ---------- Inicio ----------
export async function iniciar() {
  bodega = await abrirBodega();
  const SQL = await initSqlJs({ locateFile: (f) => `vendor/${f}` });
  const bytes = await cargarBytes();
  db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS voces (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL,
      rate REAL NOT NULL, pitch REAL NOT NULL, guion TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS perfiles (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL,
      etiqueta TEXT NOT NULL, voz_id INTEGER);
    CREATE TABLE IF NOT EXISTS bombas (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, mensajes TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reglas (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, lat REAL NOT NULL,
      lng REAL NOT NULL, radio INTEGER NOT NULL, accion TEXT NOT NULL, activa INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS historial (id INTEGER PRIMARY KEY, tipo TEXT NOT NULL, gatillo TEXT NOT NULL,
      detalle TEXT NOT NULL, fecha TEXT NOT NULL DEFAULT (datetime('now','localtime')));
  `);
  if (!bytes) {
    db.run(`INSERT INTO voces (nombre, rate, pitch, guion) VALUES
      ('Urgencia del trabajo', 1, 0.8, ?), ('Familia', 1.05, 1.2, ?)`, [
      JSON.stringify(['Hola, disculpa la hora.', 'Surgió un problema y te necesitamos en la oficina.', '¿En cuánto tiempo llegas?', 'Perfecto, aquí te esperamos.']),
      JSON.stringify(['Hola, ¿puedes hablar?', 'Necesito que vengas a la casa, por favor.', 'Nada grave, pero es urgente.', 'Gracias, con cuidado.']),
    ]);
    db.run("INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES ('Jefe', 'Trabajo', 1), ('Mamá', 'Móvil', 2)");
    db.run("INSERT INTO bombas (nombre, mensajes) VALUES ('Urgencia general', ?)", [JSON.stringify([
      { de: 'Mamá', texto: '¿Dónde estás? Llámame' }, { de: 'Trabajo', texto: 'URGENTE: revisa tu correo' },
      { de: 'Mamá', texto: 'Es importante, ven a casa' }, { de: 'Jefe', texto: 'Te estoy marcando, contesta' },
      { de: 'Grupo equipo', texto: '¿Alguien puede conectarse ya?' },
    ])]);
  }
  await programarGuardado();
}

// ---------- Respaldo ----------
const TABLAS = {
  voces: ['id', 'nombre', 'rate', 'pitch', 'guion'],
  perfiles: ['id', 'nombre', 'etiqueta', 'voz_id'],
  bombas: ['id', 'nombre', 'mensajes'],
  reglas: ['id', 'nombre', 'lat', 'lng', 'radio', 'accion', 'activa'],
  historial: ['id', 'tipo', 'gatillo', 'detalle', 'fecha'],
};
export function exportar() {
  return Object.fromEntries(Object.entries(TABLAS).map(([t, c]) => [t, todos(`SELECT ${c.join(',')} FROM ${t}`)]));
}
export function importar(datos) {
  db.run('BEGIN');
  try {
    for (const [t, cols] of Object.entries(TABLAS)) {
      if (!Array.isArray(datos[t])) throw new Error('Respaldo incompleto');
      db.run(`DELETE FROM ${t}`);
      for (const f of datos[t]) {
        db.run(`INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, cols.map((c) => f[c] ?? null));
      }
    }
    db.run('COMMIT');
  } catch (e) { db.run('ROLLBACK'); throw e; }
  return programarGuardado();
}
