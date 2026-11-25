import type { Voz } from '../../dominio/modelos';
import type { ColeccionVoces, Nuevo } from '../../dominio/puertos';
import { RepositorioSqlite } from './RepositorioSqlite';

export type FilaVoz = { id: number; nombre: string; rate: number; pitch: number; guion: string };

export class VocesSqlite extends RepositorioSqlite<Voz, FilaVoz> implements ColeccionVoces {
  protected readonly tabla = 'voces';
  protected aEntidad(f: FilaVoz): Voz { return { ...f, guion: JSON.parse(f.guion) }; }
  protected aFila(v: Nuevo<Voz>) { return { nombre: v.nombre, rate: v.rate, pitch: v.pitch, guion: JSON.stringify(v.guion) }; }
}
