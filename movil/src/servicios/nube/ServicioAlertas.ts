// Alertas a la red de cómplices: enviar, y guardar las que llegan por tiempo real.
import type { Alerta, Evento } from '../../dominio/modelos';
import type { AlertasRemotas, Avisador, Notificaciones, Ubicacion, Vibrador } from '../../dominio/puertos';

const MAXIMO = 20;

export class ServicioAlertas {
  private lista: Alerta[] = [];
  private eventos = 0;

  constructor(
    private readonly remotas: AlertasRemotas,
    private readonly ubicacion: Ubicacion,
    private readonly avisos: Avisador,
    private readonly vibrador: Vibrador,
    private readonly notificaciones: Notificaciones,
  ) {}

  get recibidas() { return this.lista; }
  // Sube con cada evento: la pantalla Cómplices lo usa para volver a cargar.
  get totalEventos() { return this.eventos; }
  olvidar() { this.lista = []; }

  async enviar(mensaje: string, conUbicacion: boolean) {
    return this.remotas.enviar(mensaje, conUbicacion ? await this.ubicacion.actual() : null);
  }

  recibir(m: Evento) {
    this.eventos++;
    if (m.tipo === 'alerta') this.guardar(m);
    else if (m.tipo === 'solicitud') this.avisos.mostrar(`${m.de} quiere ser tu cómplice.`);
    else if (m.tipo === 'aceptado') this.avisos.mostrar(`${m.de} aceptó ser tu cómplice.`);
  }

  private guardar(a: Alerta) {
    if (this.lista.some((x) => x.id === a.id)) return;
    this.lista = [a, ...this.lista].slice(0, MAXIMO);
    this.avisos.mostrar(`${a.de}: ${a.mensaje}`);
    this.vibrador.vibrar([0, 300, 100, 300]);
    this.notificaciones.mostrar({ id: `alerta-${a.id}`, titulo: `Alerta de ${a.de}`, texto: a.mensaje, tipo: 'alerta' }).catch(() => {});
  }
}
