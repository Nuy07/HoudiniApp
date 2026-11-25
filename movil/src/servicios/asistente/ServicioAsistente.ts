// Conversación con Houdini IA. Con sesión usa la IA generativa; si no se puede, la del teléfono.
import { ErrorServidor } from '../../dominio/errores';
import type { Situacion } from '../../dominio/ia/ejemplos';
import { haySenalDePeligro } from '../../dominio/ia/planes';
import type { Accion, PlanEscape } from '../../dominio/modelos';
import type { ColeccionBombas, ColeccionPerfiles, ColeccionVoces, Notificable, PlanesRemotos, Preferencias, SesionActual } from '../../dominio/puertos';
import type { Lanzador } from '../escapes/Lanzador';
import type { AsistenteLocal } from './AsistenteLocal';

const MAXIMO = 30;
const PAUSA_LOCAL = 900; // para que se note que lo está pensando
const SIN_ACTIVAR = 501;

export type Respuesta = {
  plan: PlanEscape; texto: string; origen: 'nube' | 'telefono'; situacion?: Situacion | 'general'; confianza?: number; nota?: string; guardado?: boolean;
};
export type MensajeChat = { id: number; de: 'yo'; texto: string } | { id: number; de: 'ia'; respuesta: Respuesta };

export class ServicioAsistente {
  private lista: MensajeChat[] = [];
  private ocupado = false;
  private serie = 0;
  private nubeActiva = true;

  constructor(
    private readonly local: AsistenteLocal,
    private readonly remoto: PlanesRemotos,
    private readonly sesion: SesionActual,
    private readonly preferencias: Preferencias,
    private readonly lanzador: Lanzador,
    private readonly voces: ColeccionVoces,
    private readonly perfiles: ColeccionPerfiles,
    private readonly bombas: ColeccionBombas,
    private readonly cambios: Notificable,
  ) {}

  get mensajes() { return this.lista; }
  get pensando() { return this.ocupado; }
  get permiteNube() { return this.preferencias.leer('ia_nube', '1') === '1'; }
  get usaNube() { return this.permiteNube && this.nubeActiva && this.sesion.usuario !== null; }
  get totalAprendido() { return this.local.totalAprendido; }
  permitirNube(si: boolean) {
    this.nubeActiva = true;
    this.preferencias.guardar('ia_nube', si ? 1 : 0);
  }

  async preguntar(situacion: string) {
    const texto = situacion.trim();
    if (!texto || this.ocupado) return;
    this.agregar({ id: ++this.serie, de: 'yo', texto });
    await this.responder(texto);
  }
  async otraIdea(r: Respuesta) {
    if (!this.ocupado) await this.responder(r.texto, r.plan.titulo);
  }
  usar(r: Respuesta, accion: Accion) {
    this.confirmar(r);
    this.lanzador.lanzar(accion, 'ia', r.plan);
  }
  // Deja el plan listo para el botón principal, el temporizador y los demás gatillos.
  guardar(r: Respuesta) {
    if (r.guardado) return;
    const { llamada, mensajes, titulo, accion } = r.plan;
    const vozId = this.voces.agregar(llamada.voz);
    this.preferencias.guardar('perfil', this.perfiles.agregar({ nombre: llamada.nombre, etiqueta: llamada.etiqueta, vozId }));
    this.preferencias.guardar('bomba', this.bombas.agregar({ nombre: titulo, mensajes }));
    this.preferencias.guardar('accion', accion);
    r.guardado = true;
    this.confirmar(r);
    this.cambios.avisar();
  }
  limpiar() {
    this.lista = [];
    this.cambios.avisar();
  }

  private async responder(texto: string, evitar = '') {
    this.ocupado = true;
    this.cambios.avisar();
    try {
      const respuesta = await this.pensar(texto, evitar);
      this.agregar({ id: ++this.serie, de: 'ia', respuesta });
    } finally {
      this.ocupado = false;
      this.cambios.avisar();
    }
  }
  private async pensar(texto: string, evitar: string): Promise<Respuesta> {
    let nota: string | undefined;
    // En un posible peligro no se espera a internet.
    if (this.usaNube && !haySenalDePeligro(texto)) {
      try {
        return { plan: await this.remoto.planear(texto, evitar), texto, origen: 'nube' };
      } catch (e) {
        if (e instanceof ErrorServidor && e.estado === SIN_ACTIVAR) this.nubeActiva = false;
        else nota = `${(e as Error).message} Usé la IA del teléfono.`;
      }
    } else await new Promise((r) => { setTimeout(r, PAUSA_LOCAL); });
    return { ...this.local.generar(texto, evitar), texto, origen: 'telefono', nota };
  }
  private confirmar(r: Respuesta) {
    if (r.origen === 'telefono' && r.situacion) this.local.aprender(r.texto, r.situacion);
    r.situacion = undefined; // solo se aprende una vez
  }
  private agregar(m: MensajeChat) {
    this.lista = [...this.lista, m].slice(-MAXIMO);
    this.cambios.avisar();
  }
}
