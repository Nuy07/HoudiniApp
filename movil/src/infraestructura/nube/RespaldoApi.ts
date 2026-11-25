import type { TextoCifrado } from '../../dominio/modelos';
import type { RespaldoRemoto } from '../../dominio/puertos';
import type { ClienteApi } from './ClienteApi';

export class RespaldoApi implements RespaldoRemoto {
  constructor(private readonly api: ClienteApi) {}

  leer() { return this.api.obtener<TextoCifrado>('/respaldo'); }
  async guardar(respaldo: TextoCifrado) { await this.api.guardar('/respaldo', respaldo); }
}
