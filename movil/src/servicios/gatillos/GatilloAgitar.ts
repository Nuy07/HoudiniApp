import { Rafaga } from '../../dominio/rafaga';
import type { Acelerometro, Detener, Preferencias } from '../../dominio/puertos';

const FUERZA = 2.2; // en g
const SEPARACION = 150;

export class GatilloAgitar {
  private detener: Detener | null = null;

  constructor(
    private readonly acelerometro: Acelerometro,
    private readonly preferencias: Preferencias,
    private readonly alAgitar: () => void,
  ) {}

  get activado() { return this.preferencias.leer('agitar', '0') === '1'; }

  iniciar() { if (this.activado) this.escuchar().catch(() => {}); }

  async cambiar(si: boolean) {
    this.detener?.();
    this.detener = null;
    if (si) await this.escuchar();
    this.preferencias.guardar('agitar', si ? 1 : 0);
  }

  private async escuchar() {
    if (!(await this.acelerometro.disponible())) throw new Error('Este teléfono no tiene acelerómetro.');
    if (!(await this.acelerometro.permiso())) throw new Error('No se dio permiso a los sensores.');
    const sacudida = new Rafaga(4, 1500, this.alAgitar);
    let ultimo = 0;
    this.detener = this.acelerometro.oir(({ x, y, z }) => {
      if (Math.hypot(x, y, z) > FUERZA && Date.now() - ultimo > SEPARACION) { ultimo = Date.now(); sacudida.contar(); }
    });
  }
}
