import type { Regla } from '../../dominio/modelos';
import type { ColeccionReglas, Nuevo } from '../../dominio/puertos';
import { RepositorioSqlite } from './RepositorioSqlite';

type FilaRegla = Omit<Regla, 'activa'> & { activa: number };

export class ReglasSqlite extends RepositorioSqlite<Regla, FilaRegla> implements ColeccionReglas {
  protected readonly tabla = 'reglas';

  activas() { return this.listar().filter((r) => r.activa); }

  protected aEntidad(f: FilaRegla): Regla { return { ...f, activa: f.activa === 1 }; }
  protected aFila(r: Nuevo<Regla>) {
    return { nombre: r.nombre, lat: r.lat, lng: r.lng, radio: r.radio, accion: r.accion, activa: r.activa ? 1 : 0 };
  }
}
