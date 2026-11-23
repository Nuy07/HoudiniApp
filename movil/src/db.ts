// BASE DE DATOS 1: SQLITE LOCAL
// Vive en el teléfono, así que la app funciona 100% sin internet.
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { openDatabaseSync, type SQLiteBindValue, type SQLiteDatabase } from 'expo-sqlite';
import { cambio } from './estado';

export type Voz = { id: number; nombre: string; rate: number; pitch: number; guion: string };
export type Perfil = { id: number; nombre: string; etiqueta: string; voz_id: number | null };
export type Mensaje = { de: string; texto: string };
export type Bomba = { id: number; nombre: string; mensajes: string };
export type Accion = 'llamada' | 'bomba';
export type Regla = { id: number; nombre: string; lat: number; lng: number; radio: number; accion: Accion; activa: number };
export type Registro = { id: number; tipo: string; gatillo: string; detalle: string; fecha: string };

let db: SQLiteDatabase;
let conCifrado = false;
export const cifrada = () => conCifrado;

// Clave aleatoria de la base, guardada en el almacén seguro del sistema.
function claveLocal() {
  let clave = SecureStore.getItem('clave_db');
  if (!clave) {
    clave = [...getRandomBytes(32)].map((b) => b.toString(16).padStart(2, '0')).join('');
    SecureStore.setItem('clave_db', clave);
  }
  return clave;
}

export function iniciar() {
  db = openDatabaseSync('houdini.db');
  // En la app compilada la base se cifra con SQLCipher. Expo Go no lo incluye e ignora esta línea.
  db.execSync(`PRAGMA key = "x'${claveLocal()}'"`);
  conCifrado = Boolean(db.getFirstSync('PRAGMA cipher_version'));
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS voces (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL,
      rate REAL NOT NULL, pitch REAL NOT NULL, guion TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS perfiles (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL,
      etiqueta TEXT NOT NULL, voz_id INTEGER);
    CREATE TABLE IF NOT EXISTS bombas (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, mensajes TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reglas (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, lat REAL NOT NULL,
      lng REAL NOT NULL, radio INTEGER NOT NULL, accion TEXT NOT NULL, activa INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS historial (id INTEGER PRIMARY KEY, tipo TEXT NOT NULL, gatillo TEXT NOT NULL,
      detalle TEXT NOT NULL, fecha TEXT NOT NULL);
  `);
  if (uno<{ user_version: number }>('PRAGMA user_version')!.user_version === 0) db.withTransactionSync(sembrar);
}

function sembrar() {
  const voz = 'INSERT INTO voces (nombre, rate, pitch, guion) VALUES (?, ?, ?, ?)';
  const trabajo = db.runSync(voz, ['Urgencia del trabajo', 1, 0.8, JSON.stringify(['Hola, disculpa la hora.',
    'Surgió un problema y te necesitamos en la oficina.', '¿En cuánto tiempo llegas?', 'Perfecto, aquí te esperamos.'])]);
  const familia = db.runSync(voz, ['Familia', 1.05, 1.2, JSON.stringify(['Hola, ¿puedes hablar?',
    'Necesito que vengas a la casa, por favor.', 'Nada grave, pero es urgente.', 'Gracias, con cuidado.'])]);
  db.runSync("INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES ('Jefe', 'Trabajo', ?), ('Mamá', 'Móvil', ?)",
    [trabajo.lastInsertRowId, familia.lastInsertRowId]);
  db.runSync("INSERT INTO bombas (nombre, mensajes) VALUES ('Urgencia general', ?)", [JSON.stringify([
    { de: 'Mamá', texto: '¿Dónde estás? Llámame' }, { de: 'Trabajo', texto: 'URGENTE: revisa tu correo' },
    { de: 'Mamá', texto: 'Es importante, ven a casa' }, { de: 'Jefe', texto: 'Te estoy marcando, contesta' },
    { de: 'Grupo equipo', texto: '¿Alguien puede conectarse ya?' },
  ])]);
  db.execSync('PRAGMA user_version = 1');
}

// ---------- Consultas ----------
export const todos = <T>(sql: string, params: SQLiteBindValue[] = []) => db.getAllSync<T>(sql, params);
export const uno = <T>(sql: string, params: SQLiteBindValue[] = []) => db.getFirstSync<T>(sql, params);
export function ejecutar(sql: string, params: SQLiteBindValue[] = []) {
  const r = db.runSync(sql, params);
  cambio();
  return r.lastInsertRowId;
}
export const cuantos = (tabla: string) => uno<{ n: number }>(`SELECT COUNT(*) AS n FROM ${tabla}`)!.n;

export function config(clave: string, defecto = '') {
  return uno<{ valor: string }>('SELECT valor FROM config WHERE clave = ?', [clave])?.valor ?? defecto;
}
export function ponerConfig(clave: string, valor: string | number) {
  ejecutar('INSERT INTO config VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', [clave, String(valor)]);
}

// Fecha local "AAAA-MM-DD HH:MM:SS", para agrupar por día con strftime.
export function fechaLocal(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
}
export function registrar(tipo: string, gatillo: string, detalle: string, fecha = new Date()) {
  ejecutar('INSERT INTO historial (tipo, gatillo, detalle, fecha) VALUES (?, ?, ?, ?)', [tipo, gatillo, detalle, fechaLocal(fecha)]);
}

// ---------- Respaldo ----------
const TABLAS: Record<string, string[]> = {
  voces: ['id', 'nombre', 'rate', 'pitch', 'guion'],
  perfiles: ['id', 'nombre', 'etiqueta', 'voz_id'],
  bombas: ['id', 'nombre', 'mensajes'],
  reglas: ['id', 'nombre', 'lat', 'lng', 'radio', 'accion', 'activa'],
  historial: ['id', 'tipo', 'gatillo', 'detalle', 'fecha'],
};
export function exportar() {
  return Object.fromEntries(Object.entries(TABLAS).map(([t, c]) => [t, todos(`SELECT ${c.join(',')} FROM ${t}`)]));
}
export function importar(datos: Record<string, Record<string, SQLiteBindValue>[]>) {
  db.withTransactionSync(() => {
    for (const [t, cols] of Object.entries(TABLAS)) {
      if (!Array.isArray(datos?.[t])) throw new Error('Respaldo incompleto.');
      db.runSync(`DELETE FROM ${t}`);
      const sql = `INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
      for (const f of datos[t]) db.runSync(sql, cols.map((c) => f[c] ?? null));
    }
  });
  cambio();
}
