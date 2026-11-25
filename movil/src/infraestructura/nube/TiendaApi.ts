import type { Catalogo, PaqueteDescargado, Publicacion } from '../../dominio/modelos';
import type { TiendaRemota } from '../../dominio/puertos';
import type { ClienteApi } from './ClienteApi';

export class TiendaApi implements TiendaRemota {
  constructor(private readonly api: ClienteApi) {}

  buscar(tipo: string, texto: string) { return this.api.obtener<Catalogo>(`/marketplace?tipo=${tipo}&q=${encodeURIComponent(texto)}`); }
  async publicar(p: Publicacion) { await this.api.crear('/marketplace', p); }
  descargar(id: number) { return this.api.crear<PaqueteDescargado>(`/marketplace/${id}/descargar`); }
  retirar(id: number) { return this.api.borrar(`/marketplace/${id}`); }
}
