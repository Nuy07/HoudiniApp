import type { ModoAcceso } from '../../dominio/modelos';
import type { CuentasRemotas } from '../../dominio/puertos';
import type { ClienteApi } from './ClienteApi';

export class CuentasApi implements CuentasRemotas {
  constructor(private readonly api: ClienteApi) {}

  acceder(modo: ModoAcceso, usuario: string, clave: string) {
    return this.api.crear<{ usuario: string; token: string }>(`/${modo}`, { usuario, clave });
  }
  async salir() { await this.api.crear('/salir'); }
  borrar() { return this.api.borrar('/cuenta'); }
}
