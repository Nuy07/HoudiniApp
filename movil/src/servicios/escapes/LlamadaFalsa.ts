import type { DatosLlamada, Gatillo } from '../../dominio/modelos';
import type { Avisador, ColeccionPerfiles, Notificable, Preferencias, RegistroEscapes } from '../../dominio/puertos';
import type { Escape } from './Escape';

export class LlamadaFalsa implements Escape {
  readonly tipo = 'llamada';
  readonly prioridad = 2;
  private actual: DatosLlamada | null = null;
  private serie = 0;

  constructor(
    private readonly perfiles: ColeccionPerfiles,
    private readonly preferencias: Preferencias,
    private readonly historial: RegistroEscapes,
    private readonly avisos: Avisador,
    private readonly cambios: Notificable,
  ) {}

  get datos() { return this.actual; }
  get activo() { return this.actual !== null; }

  perfil(id = Number(this.preferencias.leer('perfil', '0'))) { return this.perfiles.paraLlamar(id); }

  iniciar(gatillo: Gatillo, id?: number) {
    const p = this.perfil(id);
    if (!p) return this.avisos.mostrar('Crea un perfil primero.');
    this.actual = {
      id: ++this.serie, nombre: p.nombre, etiqueta: p.etiqueta, rate: p.voz?.rate ?? 1, pitch: p.voz?.pitch ?? 1,
      guion: p.voz?.guion ?? ['Hola, ¿puedes hablar?'],
    };
    this.historial.registrar(this.tipo, gatillo, p.nombre);
  }
  detener() {
    this.actual = null;
    this.cambios.avisar();
  }
}
