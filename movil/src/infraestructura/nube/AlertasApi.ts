import type { Coordenadas, ResultadoAlerta } from '../../dominio/modelos';
import type { AlertasRemotas } from '../../dominio/puertos';
import type { ClienteApi } from './ClienteApi';

export class AlertasApi implements AlertasRemotas {
  constructor(private readonly api: ClienteApi) {}

  enviar(mensaje: string, donde: Coordenadas | null) { return this.api.crear<ResultadoAlerta>('/alertas', { mensaje, ...donde }); }
}
