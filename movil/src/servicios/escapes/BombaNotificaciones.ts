import type { Burbuja, Gatillo, Mensaje } from '../../dominio/modelos';
import type {
  Avisador, ColeccionBombas, Notificable, Notificaciones, Preferencias, RegistroEscapes, Sonidos, Vibrador,
} from '../../dominio/puertos';
import type { Escape, QueLanzar } from './Escape';

const PAUSA = 1300;
const VISIBLE = 7000;

export class BombaNotificaciones implements Escape {
  readonly tipo = 'bomba';
  readonly prioridad = 1;
  private visibles: Burbuja[] = [];
  private relojes: ReturnType<typeof setTimeout>[] = [];
  private mensajes: Mensaje[] = [];
  private enCurso = false;
  private serie = 0;

  constructor(
    private readonly bombas: ColeccionBombas,
    private readonly preferencias: Preferencias,
    private readonly historial: RegistroEscapes,
    private readonly sonidos: Sonidos,
    private readonly vibrador: Vibrador,
    private readonly notificaciones: Notificaciones,
    private readonly avisos: Avisador,
    private readonly cambios: Notificable,
  ) {}

  get burbujas() { return this.visibles; }
  get activo() { return this.enCurso; }

  iniciar(gatillo: Gatillo, que: QueLanzar = Number(this.preferencias.leer('bomba', '0'))) {
    const b = typeof que === 'object' ? { nombre: que.titulo, mensajes: que.mensajes } : this.bombas.paraLanzar(que);
    if (!b) return this.avisos.mostrar('Crea una bomba de notificaciones primero.');
    this.historial.registrar(this.tipo, gatillo, b.nombre);
    this.enCurso = true;
    this.mensajes = b.mensajes;
    b.mensajes.forEach((m, i) => {
      this.despues(i * PAUSA, () => this.aparecer(m));
      // Estas solo se ven si la app pasa a segundo plano.
      const segundos = Math.max(1, Math.round((i * PAUSA) / 1000));
      this.notificaciones.mostrar({ id: `bomba-${i}`, titulo: m.de, texto: m.texto, tipo: 'bomba', segundos }).catch(() => {});
    });
    this.despues(b.mensajes.length * PAUSA + VISIBLE, () => this.detener());
  }
  detener() {
    this.relojes.forEach(clearTimeout);
    this.relojes = [];
    this.mensajes.forEach((_, i) => this.notificaciones.cancelar(`bomba-${i}`));
    this.visibles = [];
    this.enCurso = false;
    this.cambios.avisar();
  }
  quitar(id: number) {
    this.visibles = this.visibles.filter((b) => b.id !== id);
    this.cambios.avisar();
  }

  private aparecer(m: Mensaje) {
    const nueva = { ...m, id: ++this.serie };
    this.visibles = [nueva, ...this.visibles];
    this.sonidos.mensaje();
    this.vibrador.vibrar(200);
    this.cambios.avisar();
    this.despues(VISIBLE, () => this.quitar(nueva.id));
  }
  private despues(ms: number, fn: () => void) { this.relojes.push(setTimeout(fn, ms)); }
}
