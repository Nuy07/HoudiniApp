import { DetectorLlegadas } from '../../dominio/geografia';
import type { Accion } from '../../dominio/modelos';
import type { Avisador, ColeccionReglas, Detener, Ubicacion } from '../../dominio/puertos';

export class GatilloGps {
  private readonly llegadas = new DetectorLlegadas();
  private detener: Detener | null = null;
  private turno = 0;

  constructor(
    private readonly ubicacion: Ubicacion,
    private readonly reglas: ColeccionReglas,
    private readonly avisos: Avisador,
    private readonly alLlegar: (accion: Accion) => void,
  ) {}

  // Se llama al abrir la app y cada vez que cambian las reglas.
  vigilar() {
    this.revisar().catch((e) => {
      console.warn('GPS:', e);
      this.avisos.mostrar('No se pudo vigilar tu ubicación. Revisa que esté encendida.');
    });
  }
  reglaCambiada(id?: number) {
    if (id) this.llegadas.olvidar(id);
    this.vigilar();
  }
  reglasReemplazadas() {
    this.llegadas.olvidarTodo();
    this.vigilar();
  }

  private async revisar() {
    const mio = ++this.turno;
    if (!this.reglas.activas().length) { this.detener?.(); this.detener = null; return; }
    if (this.detener) return;
    if (!(await this.ubicacion.permiso())) return this.avisos.mostrar('Sin permiso de ubicación, las reglas GPS no funcionan.');
    const detener = await this.ubicacion.vigilar((donde) => {
      for (const r of this.llegadas.evaluar(this.reglas.activas(), donde)) this.alLlegar(r.accion);
    });
    // Si mientras tanto hubo otro cambio, este vigía ya no sirve.
    if (mio !== this.turno || this.detener) detener();
    else this.detener = detener;
  }
}
