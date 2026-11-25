// Lo común de todas las tablas: listar, agregar, actualizar y eliminar.
// Cada repositorio solo dice cómo se convierte su fila.
import type { Coleccion, Nuevo } from '../../dominio/puertos';
import type { BaseLocal, Dato } from './BaseLocal';

export abstract class RepositorioSqlite<T extends { id: number }, Fila> implements Coleccion<T> {
  protected abstract readonly tabla: string;
  protected abstract aEntidad(f: Fila): T;
  protected abstract aFila(d: Nuevo<T>): Record<string, Dato>;

  constructor(protected readonly bd: BaseLocal) {}

  listar() { return this.bd.todos<Fila>(`SELECT * FROM ${this.tabla} ORDER BY id`).map((f) => this.aEntidad(f)); }

  agregar(d: Nuevo<T>) {
    const fila = this.aFila(d);
    const columnas = Object.keys(fila);
    return this.bd.ejecutar(
      `INSERT INTO ${this.tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`, Object.values(fila));
  }
  actualizar(id: number, d: Nuevo<T>) {
    const fila = this.aFila(d);
    const cambios = Object.keys(fila).map((c) => `${c} = ?`).join(', ');
    this.bd.ejecutar(`UPDATE ${this.tabla} SET ${cambios} WHERE id = ?`, [...Object.values(fila), id]);
  }
  eliminar(id: number) { this.bd.ejecutar(`DELETE FROM ${this.tabla} WHERE id = ?`, [id]); }

  // La fila con ese id o, si ya no existe, la primera.
  protected elegir(id: number) {
    const f = this.bd.uno<Fila>(`SELECT * FROM ${this.tabla} WHERE id = ?`, [id])
      ?? this.bd.uno<Fila>(`SELECT * FROM ${this.tabla} ORDER BY id LIMIT 1`);
    return f && this.aEntidad(f);
  }
}
