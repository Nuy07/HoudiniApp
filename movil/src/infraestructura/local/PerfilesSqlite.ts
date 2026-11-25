import type { Perfil, PerfilConVoz } from '../../dominio/modelos';
import type { ColeccionPerfiles, ColeccionVoces, Nuevo } from '../../dominio/puertos';
import type { BaseLocal } from './BaseLocal';
import { RepositorioSqlite } from './RepositorioSqlite';

type FilaPerfil = { id: number; nombre: string; etiqueta: string; voz_id: number | null };

export class PerfilesSqlite extends RepositorioSqlite<Perfil, FilaPerfil> implements ColeccionPerfiles {
  protected readonly tabla = 'perfiles';

  constructor(bd: BaseLocal, private readonly voces: ColeccionVoces) { super(bd); }

  paraLlamar(id: number): PerfilConVoz | null {
    const p = this.elegir(id);
    return p && { ...p, voz: this.voces.listar().find((v) => v.id === p.vozId) ?? null };
  }

  protected aEntidad(f: FilaPerfil): Perfil { return { id: f.id, nombre: f.nombre, etiqueta: f.etiqueta, vozId: f.voz_id }; }
  protected aFila(p: Nuevo<Perfil>) { return { nombre: p.nombre, etiqueta: p.etiqueta, voz_id: p.vozId }; }
}
