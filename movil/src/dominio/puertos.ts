// Contratos pequeños que necesitan los servicios. La carpeta "infraestructura" los cumple,
// así los servicios no dependen de Expo, SQLite ni internet.
import type {
  Bomba, Catalogo, Complice, Conteo, Coordenadas, Gatillo, ModoAcceso, PaqueteDescargado, Perfil, PerfilConVoz,
  Publicacion, Registro, Regla, ResultadoAlerta, Sesion, TextoCifrado, Voz,
} from './modelos';

export type Detener = () => void;

// ---------- Interfaz ----------
export interface Avisador { mostrar(texto: string): void }
export interface Notificable { avisar(): void }

// ---------- Datos del teléfono ----------
export type Nuevo<T extends { id: number }> = Omit<T, 'id'>;
export interface Coleccion<T extends { id: number }> {
  listar(): T[];
  agregar(datos: Nuevo<T>): number;
  actualizar(id: number, datos: Nuevo<T>): void;
  eliminar(id: number): void;
}
export type ColeccionVoces = Coleccion<Voz>;
export interface ColeccionPerfiles extends Coleccion<Perfil> {
  paraLlamar(id: number): PerfilConVoz | null; // si no existe, el primero
}
export interface ColeccionBombas extends Coleccion<Bomba> {
  paraLanzar(id: number): Bomba | null;
}
export interface ColeccionReglas extends Coleccion<Regla> {
  activas(): Regla[];
}
export interface RegistroEscapes {
  registrar(tipo: string, gatillo: Gatillo, detalle: string, fecha?: Date): void;
}
export interface ConsultaHistorial {
  total(): number;
  deEjemplo(): number;
  porDia(): Conteo[];
  porTipo(): Conteo[];
  porGatillo(): Conteo[];
  recientes(): Registro[];
  quitarEjemplos(): void;
  borrar(): void;
}
export type ClavePreferencia = 'estilo' | 'proximidad' | 'accion' | 'agitar' | 'perfil' | 'bomba' | 'servidor';
export interface Preferencias {
  leer(clave: ClavePreferencia, defecto?: string): string;
  guardar(clave: ClavePreferencia, valor: string | number): void;
}
export interface CopiaLocal {
  exportar(): string;
  importar(texto: string): void;
}
export interface AlmacenSeguro {
  leer(clave: string): string | null;
  guardar(clave: string, valor: string): void;
  borrar(clave: string): Promise<void>;
}

// ---------- Nube ----------
export interface CuentasRemotas {
  acceder(modo: ModoAcceso, usuario: string, clave: string): Promise<{ usuario: string; token: string }>;
  salir(): Promise<void>;
  borrar(): Promise<void>;
}
export interface RespaldoRemoto {
  leer(): Promise<TextoCifrado>;
  guardar(respaldo: TextoCifrado): Promise<void>;
}
export interface TiendaRemota {
  buscar(tipo: string, texto: string): Promise<Catalogo>;
  publicar(p: Publicacion): Promise<void>;
  descargar(id: number): Promise<PaqueteDescargado>;
  retirar(id: number): Promise<void>;
}
export interface ComplicesRemotos {
  listar(): Promise<Complice[]>;
  pedir(usuario: string): Promise<string>;
  aceptar(usuario: string): Promise<void>;
  quitar(usuario: string): Promise<void>;
}
export interface AlertasRemotas {
  enviar(mensaje: string, donde: Coordenadas | null): Promise<ResultadoAlerta>;
}
export interface SesionActual {
  readonly usuario: string | null;
  readonly token: string | null;
  exigir(): Sesion;
  abrir(s: Sesion): void;
  cerrar(): Promise<void>;
}
export interface Cifrador {
  cifrar(clave: string, texto: string): TextoCifrado;
  descifrar(clave: string, cifrado: TextoCifrado): string;
}
export interface DerivadorClaves {
  derivar(contrasena: string, sal: string): Promise<string>; // 64 bytes en hexadecimal
}

// ---------- Aparatos del teléfono ----------
export interface Sonidos {
  iniciarTono(): void;
  pararTono(): void;
  mensaje(): void;
}
export interface Vibrador {
  vibrar(patron: number | number[], repetir?: boolean): void;
  parar(): void;
}
export interface Hablante {
  decir(texto: string, tono: { rate: number; pitch: number }, alTerminar: () => void): void;
  callar(): void;
}
export type Aviso = { id: string; titulo: string; texto: string; tipo: string; segundos?: number };
export interface Notificaciones {
  permiso(pedir: boolean): Promise<boolean>;
  mostrar(a: Aviso): Promise<void>; // sin permiso no hace nada
  cancelar(id: string): void;
}
export type Aceleracion = { x: number; y: number; z: number }; // en g: en reposo vale 1
export interface Acelerometro {
  disponible(): Promise<boolean>;
  permiso(): Promise<boolean>;
  oir(fn: (a: Aceleracion) => void): Detener;
}
export interface Ubicacion {
  permiso(): Promise<boolean>;
  actual(): Promise<Coordenadas>;
  vigilar(fn: (c: Coordenadas) => void): Promise<Detener>;
}
export interface CicloApp {
  activa(): boolean;
  alActivar(fn: () => void): void;
  alVolver(fn: () => void): void; // solo si de verdad estuvo en segundo plano
}
