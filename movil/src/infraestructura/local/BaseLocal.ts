// BASE DE DATOS 1: SQLITE LOCAL
// Vive en el teléfono, así que la app funciona 100% sin internet.
import { getRandomBytes } from 'expo-crypto';
import { openDatabaseSync, type SQLiteBindValue, type SQLiteDatabase } from 'expo-sqlite';
import type { AlmacenSeguro, Notificable } from '../../dominio/puertos';
import { ESQUEMA, sembrar } from './esquema';

export type Dato = SQLiteBindValue;
export type Ejecutar = (sql: string, params?: Dato[]) => void;

export class BaseLocal {
  private bd!: SQLiteDatabase;
  private conCifrado = false;

  constructor(private readonly almacen: AlmacenSeguro, private readonly cambios: Notificable) {}

  get cifrada() { return this.conCifrado; }

  abrir() {
    this.bd = openDatabaseSync('houdini.db');
    // En la app compilada la base se cifra con SQLCipher. Expo Go no lo incluye e ignora esta línea.
    this.bd.execSync(`PRAGMA key = "x'${this.clave()}'"`);
    this.conCifrado = Boolean(this.bd.getFirstSync('PRAGMA cipher_version'));
    this.bd.execSync(ESQUEMA);
    const version = this.uno<{ user_version: number }>('PRAGMA user_version')!.user_version;
    if (version === 0) this.bd.withTransactionSync(() => sembrar(this.bd));
  }

  todos<T>(sql: string, params: Dato[] = []) { return this.bd.getAllSync<T>(sql, params); }
  uno<T>(sql: string, params: Dato[] = []) { return this.bd.getFirstSync<T>(sql, params); }
  contar(tabla: string) { return this.uno<{ n: number }>(`SELECT COUNT(*) AS n FROM ${tabla}`)!.n; }

  // Devuelve el id de la fila nueva.
  ejecutar(sql: string, params: Dato[] = []) {
    const r = this.bd.runSync(sql, params);
    this.cambios.avisar();
    return r.lastInsertRowId;
  }
  // Todo o nada.
  transaccion(fn: (ejecutar: Ejecutar) => void) {
    this.bd.withTransactionSync(() => fn((sql, params = []) => { this.bd.runSync(sql, params); }));
    this.cambios.avisar();
  }

  // Clave aleatoria de la base, guardada en el almacén seguro del sistema.
  private clave() {
    let clave = this.almacen.leer('clave_db');
    if (!clave) {
      clave = [...getRandomBytes(32)].map((b) => b.toString(16).padStart(2, '0')).join('');
      this.almacen.guardar('clave_db', clave);
    }
    return clave;
  }
}
