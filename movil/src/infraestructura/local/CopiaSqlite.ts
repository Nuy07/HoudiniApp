// Copia completa de los datos del teléfono, para el respaldo.
import type { CopiaLocal } from '../../dominio/puertos';
import type { BaseLocal, Dato } from './BaseLocal';

const TABLAS: Record<string, string[]> = {
  voces: ['id', 'nombre', 'rate', 'pitch', 'guion'],
  perfiles: ['id', 'nombre', 'etiqueta', 'voz_id'],
  bombas: ['id', 'nombre', 'mensajes'],
  reglas: ['id', 'nombre', 'lat', 'lng', 'radio', 'accion', 'activa'],
  historial: ['id', 'tipo', 'gatillo', 'detalle', 'fecha'],
};

export class CopiaSqlite implements CopiaLocal {
  constructor(private readonly bd: BaseLocal) {}

  exportar() {
    return JSON.stringify(Object.fromEntries(
      Object.entries(TABLAS).map(([t, c]) => [t, this.bd.todos(`SELECT ${c.join(',')} FROM ${t}`)])));
  }
  importar(texto: string) {
    const datos = JSON.parse(texto) as Record<string, Record<string, Dato>[]>;
    this.bd.transaccion((ejecutar) => {
      for (const [t, cols] of Object.entries(TABLAS)) {
        if (!Array.isArray(datos?.[t])) throw new Error('Respaldo incompleto.');
        ejecutar(`DELETE FROM ${t}`);
        const sql = `INSERT INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
        for (const f of datos[t]) ejecutar(sql, cols.map((c) => f[c] ?? null));
      }
    });
  }
}
