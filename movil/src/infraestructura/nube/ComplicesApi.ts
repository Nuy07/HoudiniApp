import type { Complice } from '../../dominio/modelos';
import type { ComplicesRemotos } from '../../dominio/puertos';
import type { ClienteApi } from './ClienteApi';

export class ComplicesApi implements ComplicesRemotos {
  constructor(private readonly api: ClienteApi) {}

  listar() { return this.api.obtener<Complice[]>('/complices'); }
  async pedir(usuario: string) { return (await this.api.crear<{ mensaje: string }>('/complices', { usuario })).mensaje; }
  async aceptar(usuario: string) { await this.api.crear(`/complices/${encodeURIComponent(usuario)}/aceptar`); }
  quitar(usuario: string) { return this.api.borrar(`/complices/${encodeURIComponent(usuario)}`); }
}
