// Arma todas las piezas. Es el único lugar que sabe qué clase concreta usa cada servicio.
import { Keyboard, Platform } from 'react-native';
import { AcelerometroExpo } from './infraestructura/dispositivo/AcelerometroExpo';
import { AlmacenSeguroExpo } from './infraestructura/dispositivo/AlmacenSeguroExpo';
import { CicloAppNativo } from './infraestructura/dispositivo/CicloAppNativo';
import { CifradorAesGcm } from './infraestructura/dispositivo/CifradorAesGcm';
import { DerivadorWebView } from './infraestructura/dispositivo/DerivadorWebView';
import { HablanteExpo } from './infraestructura/dispositivo/HablanteExpo';
import { NotificacionesExpo } from './infraestructura/dispositivo/NotificacionesExpo';
import { SonidosExpo } from './infraestructura/dispositivo/SonidosExpo';
import { UbicacionExpo } from './infraestructura/dispositivo/UbicacionExpo';
import { VibradorNativo } from './infraestructura/dispositivo/VibradorNativo';
import { BaseLocal } from './infraestructura/local/BaseLocal';
import { BombasSqlite } from './infraestructura/local/BombasSqlite';
import { CopiaSqlite } from './infraestructura/local/CopiaSqlite';
import { HistorialSqlite } from './infraestructura/local/HistorialSqlite';
import { PerfilesSqlite } from './infraestructura/local/PerfilesSqlite';
import { PreferenciasSqlite } from './infraestructura/local/PreferenciasSqlite';
import { ReglasSqlite } from './infraestructura/local/ReglasSqlite';
import { VocesSqlite } from './infraestructura/local/VocesSqlite';
import { AlertasApi } from './infraestructura/nube/AlertasApi';
import { CanalTiempoReal } from './infraestructura/nube/CanalTiempoReal';
import { ClienteApi } from './infraestructura/nube/ClienteApi';
import { ComplicesApi } from './infraestructura/nube/ComplicesApi';
import { CuentasApi } from './infraestructura/nube/CuentasApi';
import { DireccionServidor } from './infraestructura/nube/DireccionServidor';
import { RespaldoApi } from './infraestructura/nube/RespaldoApi';
import { SesionGuardada } from './infraestructura/nube/SesionGuardada';
import { TiendaApi } from './infraestructura/nube/TiendaApi';
import type {
  ColeccionBombas, ColeccionPerfiles, ColeccionReglas, ColeccionVoces, ComplicesRemotos, ConsultaHistorial, Notificaciones, Preferencias, Ubicacion,
} from './dominio/puertos';
import { Avisos } from './estado/Avisos';
import { Emisor } from './dominio/Emisor';
import { Formularios } from './estado/Formularios';
import { Navegacion } from './estado/Navegacion';
import { DatosEjemplo } from './servicios/DatosEjemplo';
import { BombaNotificaciones } from './servicios/escapes/BombaNotificaciones';
import { Lanzador } from './servicios/escapes/Lanzador';
import { LlamadaFalsa } from './servicios/escapes/LlamadaFalsa';
import { GatilloAgitar } from './servicios/gatillos/GatilloAgitar';
import { GatilloGps } from './servicios/gatillos/GatilloGps';
import { ModoDiscreto } from './servicios/gatillos/ModoDiscreto';
import { Temporizador } from './servicios/gatillos/Temporizador';
import { DetectorOido } from './servicios/llamada/DetectorOido';
import { EstiloLlamada } from './servicios/llamada/EstiloLlamada';
import { Narrador } from './servicios/llamada/Narrador';
import { Timbre } from './servicios/llamada/Timbre';
import { ServicioAlertas } from './servicios/nube/ServicioAlertas';
import { ServicioCuenta } from './servicios/nube/ServicioCuenta';
import { ServicioRespaldo } from './servicios/nube/ServicioRespaldo';
import { ServicioTienda } from './servicios/nube/ServicioTienda';

// Lo que pueden usar las vistas. Hacia fuera se muestran contratos, no clases de Expo o SQLite.
export interface Contenedor {
  cambios: Emisor; navegacion: Navegacion; avisos: Avisos; formularios: Formularios;
  base: { readonly cifrada: boolean };
  voces: ColeccionVoces; perfiles: ColeccionPerfiles; bombas: ColeccionBombas; reglas: ColeccionReglas;
  historial: ConsultaHistorial; preferencias: Preferencias; ejemplos: DatosEjemplo;
  lanzador: Lanzador; llamada: LlamadaFalsa; bomba: BombaNotificaciones;
  estiloLlamada: EstiloLlamada; timbre: Timbre; narrador: Narrador; oido: DetectorOido;
  agitar: GatilloAgitar; gps: GatilloGps; temporizador: Temporizador; discreto: ModoDiscreto;
  notificaciones: Notificaciones; ubicacion: Ubicacion;
  servidor: DireccionServidor; api: { probar(): Promise<void> }; canal: { readonly enLinea: boolean };
  cuenta: ServicioCuenta; respaldo: ServicioRespaldo; tienda: ServicioTienda; complices: ComplicesRemotos; alertas: ServicioAlertas;
  derivador: DerivadorWebView;
  iniciar(): Promise<void>;
}

export function crearContenedor(): Contenedor {
  // Estado de la interfaz
  const cambios = new Emisor();
  const navegacion = new Navegacion(cambios);
  const avisos = new Avisos(cambios);
  const formularios = new Formularios(cambios);

  // Aparatos del teléfono
  const almacen = new AlmacenSeguroExpo();
  const sonidos = new SonidosExpo();
  const vibrador = new VibradorNativo();
  const notificaciones = new NotificacionesExpo();
  const acelerometro = new AcelerometroExpo();
  const ubicacion = new UbicacionExpo();
  const ciclo = new CicloAppNativo();
  const derivador = new DerivadorWebView(cambios);

  // Base local
  const base = new BaseLocal(almacen, cambios);
  const voces = new VocesSqlite(base);
  const perfiles = new PerfilesSqlite(base, voces);
  const bombas = new BombasSqlite(base);
  const reglas = new ReglasSqlite(base);
  const historial = new HistorialSqlite(base);
  const preferencias = new PreferenciasSqlite(base);

  // Escapes
  const llamada = new LlamadaFalsa(perfiles, preferencias, historial, avisos, cambios);
  const bomba = new BombaNotificaciones(bombas, preferencias, historial, sonidos, vibrador, notificaciones, avisos, cambios);
  const lanzador = new Lanzador([llamada, bomba], preferencias, () => Keyboard.dismiss());

  // Gatillos
  const agitar = new GatilloAgitar(acelerometro, preferencias, () => lanzador.lanzarPreferido('agitar'));
  const gps = new GatilloGps(ubicacion, reglas, avisos, (accion) => lanzador.lanzar(accion, 'gps'));
  const temporizador = new Temporizador(notificaciones, ciclo, avisos, () => llamada.perfil()?.nombre, () => lanzador.lanzarPreferido('temporizador'));
  const discreto = new ModoDiscreto(cambios, () => lanzador.lanzarPreferido('discreto'));

  // Nube
  const servidor = new DireccionServidor(preferencias);
  const sesion = new SesionGuardada(almacen, cambios);
  const api = new ClienteApi(servidor, sesion);
  const complices = new ComplicesApi(api);
  const canal = new CanalTiempoReal(servidor, sesion, ciclo, cambios, () => complices.listar());
  const alertas = new ServicioAlertas(new AlertasApi(api), ubicacion, avisos, vibrador, notificaciones);
  const cuenta = new ServicioCuenta(new CuentasApi(api), sesion, derivador, () => alertas.olvidar());
  const respaldo = new ServicioRespaldo(new RespaldoApi(api), new CopiaSqlite(base), new CifradorAesGcm(), sesion, () => gps.reglasReemplazadas());
  const tienda = new ServicioTienda(new TiendaApi(api), voces, perfiles);

  async function iniciar() {
    base.abrir();
    sonidos.preparar();
    await notificaciones.iniciar().catch((x) => console.warn('Canal de notificaciones:', x));
    sesion.cargar();
    canal.iniciar((e) => alertas.recibir(e));
    temporizador.iniciar();
    agitar.iniciar();
    gps.vigilar();
    notificaciones.alTocar((tipo) => {
      if (tipo === 'programado') temporizador.disparar();
      if (tipo === 'alerta') navegacion.ir('complices');
    });
  }

  return {
    cambios, navegacion, avisos, formularios, base, voces, perfiles, bombas, reglas, historial, preferencias,
    ejemplos: new DatosEjemplo(historial), lanzador, llamada, bomba,
    estiloLlamada: new EstiloLlamada(preferencias, Platform.OS === 'ios' ? 'ios' : 'android'),
    timbre: new Timbre(sonidos, vibrador), narrador: new Narrador(new HablanteExpo()), oido: new DetectorOido(acelerometro, preferencias),
    agitar, gps, temporizador, discreto, notificaciones, ubicacion, servidor, api, canal,
    cuenta, respaldo, tienda, complices, alertas, derivador, iniciar,
  };
}
