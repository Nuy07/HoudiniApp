// Con la app abierta dispara un reloj; en segundo plano llega una notificación que abre la llamada.
import { tiempoCorto } from '../../dominio/textos';
import type { Avisador, CicloApp, Notificaciones } from '../../dominio/puertos';

const ID = 'programado';

export class Temporizador {
  private hora = 0;
  private reloj?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly notificaciones: Notificaciones,
    private readonly ciclo: CicloApp,
    private readonly avisos: Avisador,
    private readonly quienLlama: () => string | undefined,
    private readonly alTerminar: () => void,
  ) {}

  iniciar() { this.ciclo.alActivar(() => this.revisar()); }

  async programar(segundos: number) {
    const conPermiso = await this.notificaciones.permiso(true);
    this.hora = Date.now() + segundos * 1000;
    clearTimeout(this.reloj);
    this.reloj = setTimeout(() => this.revisar(), segundos * 1000);
    await this.notificaciones.mostrar({ id: ID, titulo: this.quienLlama() ?? 'Llamada', texto: 'Llamada entrante', tipo: ID, segundos });
    this.avisos.mostrar(`Escape programado en ${tiempoCorto(segundos)}.${conPermiso ? '' : ' Sin permiso de notificaciones, deja la app abierta.'}`);
  }
  cancelar() {
    this.limpiar();
    this.avisos.mostrar('Escape programado cancelado.');
  }
  disparar() {
    this.limpiar();
    this.alTerminar();
  }

  private revisar() {
    if (!this.hora || Date.now() < this.hora - 500 || !this.ciclo.activa()) return;
    this.disparar();
  }
  private limpiar() {
    clearTimeout(this.reloj);
    this.hora = 0;
    this.notificaciones.cancelar(ID);
  }
}
