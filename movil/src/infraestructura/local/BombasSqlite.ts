import type { Bomba } from '../../dominio/modelos';
import type { ColeccionBombas, Nuevo } from '../../dominio/puertos';
import { RepositorioSqlite } from './RepositorioSqlite';

type FilaBomba = { id: number; nombre: string; mensajes: string };

export class BombasSqlite extends RepositorioSqlite<Bomba, FilaBomba> implements ColeccionBombas {
  protected readonly tabla = 'bombas';

  paraLanzar(id: number) { return this.elegir(id); }

  protected aEntidad(f: FilaBomba): Bomba { return { ...f, mensajes: JSON.parse(f.mensajes) }; }
  protected aFila(b: Nuevo<Bomba>) { return { nombre: b.nombre, mensajes: JSON.stringify(b.mensajes) }; }
}
