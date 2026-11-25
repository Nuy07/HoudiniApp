import type { Preferencias } from '../../dominio/puertos';

export type Estilo = 'ios' | 'android';

export class EstiloLlamada {
  constructor(private readonly preferencias: Preferencias, private readonly delTelefono: Estilo) {}

  actual(): Estilo {
    const elegido = this.preferencias.leer('estilo', 'auto');
    return elegido === 'ios' || elegido === 'android' ? elegido : this.delTelefono;
  }
}
