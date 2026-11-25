// Expo no expone el sensor de proximidad, así que se usa la inclinación del teléfono.
import type { Acelerometro, Detener, Preferencias } from '../../dominio/puertos';

export class DetectorOido {
  constructor(private readonly acelerometro: Acelerometro, private readonly preferencias: Preferencias) {}

  get activado() { return this.preferencias.leer('proximidad', '1') === '1'; }

  async disponible() { return this.activado && this.acelerometro.disponible().catch(() => false); }

  // Avisa solo cuando cambia.
  vigilar(fn: (enOido: boolean) => void): Detener {
    let antes = false;
    return this.acelerometro.oir(({ x, y }) => {
      const ahora = Math.abs(x) > 0.75 || Math.abs(y) > 0.93;
      if (ahora === antes) return;
      antes = ahora;
      fn(ahora);
    });
  }
}
