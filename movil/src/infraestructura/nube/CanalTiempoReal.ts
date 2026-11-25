// WebSocket con la API: recibe solicitudes y alertas al instante, y se reconecta solo.
import type { Evento } from '../../dominio/modelos';
import type { CicloApp, Notificable, SesionActual } from '../../dominio/puertos';
import type { Emisor } from '../../dominio/Emisor';
import type { DireccionServidor } from './DireccionServidor';

const SESION_NO_VALIDA = 4001;
const ESPERA_INICIAL = 1000;
const ESPERA_MAXIMA = 30000;

export class CanalTiempoReal {
  private socket: WebSocket | null = null;
  private conectado = false;
  private espera = ESPERA_INICIAL;
  private reloj?: ReturnType<typeof setTimeout>;
  private alRecibir: (e: Evento) => void = () => {};

  constructor(
    private readonly direccion: DireccionServidor,
    private readonly sesion: SesionActual & { cambio: Emisor },
    private readonly ciclo: CicloApp,
    private readonly cambios: Notificable,
    private readonly comprobarSesion: () => Promise<unknown>,
  ) {}

  get enLinea() { return this.conectado; }

  iniciar(oyente: (e: Evento) => void) {
    this.alRecibir = oyente;
    const reconectar = () => this.reconectar();
    this.direccion.cambio.suscribir(reconectar);
    this.sesion.cambio.suscribir(reconectar);
    // Al volver a la app el socket puede estar muerto sin avisar: se abre uno nuevo.
    this.ciclo.alVolver(reconectar);
    this.conectar();
  }

  private reconectar() {
    this.cerrar();
    this.espera = ESPERA_INICIAL;
    this.conectar();
    this.cambios.avisar();
  }
  private cerrar() {
    clearTimeout(this.reloj);
    const ws = this.socket;
    this.socket = null;
    this.conectado = false;
    ws?.close();
  }
  private conectar() {
    clearTimeout(this.reloj);
    if (!this.sesion.token || this.socket) return;
    const ws = new WebSocket(this.direccion.urlTiempoReal);
    this.socket = ws;
    ws.onopen = () => ws.send(JSON.stringify({ tipo: 'auth', token: this.sesion.token }));
    ws.onmessage = ({ data }) => { if (this.socket === ws) this.atender(ws, JSON.parse(data) as Evento); };
    ws.onclose = ({ code }) => { if (this.socket === ws) this.alCerrarse(code); };
  }
  private atender(ws: WebSocket, m: Evento) {
    if (m.tipo === 'listo') { this.espera = ESPERA_INICIAL; this.conectado = true; }
    if (m.tipo === 'alerta') ws.send(JSON.stringify({ tipo: 'recibida', id: m.id }));
    this.alRecibir(m);
    this.cambios.avisar();
  }
  private alCerrarse(codigo?: number) {
    this.socket = null;
    this.conectado = false;
    this.cambios.avisar();
    if (codigo === SESION_NO_VALIDA) {
      // Sesión vencida o cuenta borrada: la API responde 401 y se cierra la sesión local.
      this.comprobarSesion().catch(() => {});
      return;
    }
    this.reloj = setTimeout(() => this.conectar(), this.espera);
    this.espera = Math.min(this.espera * 2, ESPERA_MAXIMA);
  }
}
