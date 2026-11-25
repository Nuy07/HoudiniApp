// Tablas de la base del teléfono y sus datos iniciales.
import type { SQLiteDatabase } from 'expo-sqlite';

export const ESQUEMA = `
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
`;

export function sembrar(bd: SQLiteDatabase) {
  const voz = 'INSERT INTO voces (nombre, rate, pitch, guion) VALUES (?, ?, ?, ?)';
  const trabajo = bd.runSync(voz, ['Urgencia del trabajo', 1, 0.8, JSON.stringify(['Hola, disculpa la hora.',
    'Surgió un problema y te necesitamos en la oficina.', '¿En cuánto tiempo llegas?', 'Perfecto, aquí te esperamos.'])]);
  const familia = bd.runSync(voz, ['Familia', 1.05, 1.2, JSON.stringify(['Hola, ¿puedes hablar?',
    'Necesito que vengas a la casa, por favor.', 'Nada grave, pero es urgente.', 'Gracias, con cuidado.'])]);
  bd.runSync("INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES ('Jefe', 'Trabajo', ?), ('Mamá', 'Móvil', ?)",
    [trabajo.lastInsertRowId, familia.lastInsertRowId]);
  bd.runSync("INSERT INTO bombas (nombre, mensajes) VALUES ('Urgencia general', ?)", [JSON.stringify([
    { de: 'Mamá', texto: '¿Dónde estás? Llámame' }, { de: 'Trabajo', texto: 'URGENTE: revisa tu correo' },
    { de: 'Mamá', texto: 'Es importante, ven a casa' }, { de: 'Jefe', texto: 'Te estoy marcando, contesta' },
    { de: 'Grupo equipo', texto: '¿Alguien puede conectarse ya?' },
  ])]);
  bd.execSync('PRAGMA user_version = 1');
}
