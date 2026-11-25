// Objetos del negocio: solo datos, sin React, Expo ni base.

// ---------- Escapes ----------
export type Accion = 'llamada' | 'bomba';
export type Gatillo = 'boton' | 'menu' | 'agitar' | 'discreto' | 'temporizador' | 'gps' | 'prueba' | 'demo';

export type Voz = { id: number; nombre: string; rate: number; pitch: number; guion: string[] };
export type Perfil = { id: number; nombre: string; etiqueta: string; vozId: number | null };
export type PerfilConVoz = Perfil & { voz: Voz | null };
export type Mensaje = { de: string; texto: string };
export type Bomba = { id: number; nombre: string; mensajes: Mensaje[] };
export type DatosLlamada = { id: number; nombre: string; etiqueta: string; rate: number; pitch: number; guion: string[] };
export type Burbuja = Mensaje & { id: number };

// ---------- Reglas GPS ----------
export type Coordenadas = { lat: number; lng: number };
export type Regla = Coordenadas & { id: number; nombre: string; radio: number; accion: Accion; activa: boolean };

// ---------- Historial ----------
export type Registro = { id: number; tipo: string; gatillo: string; detalle: string; fecha: string };
export type Conteo = { clave: string; total: number };

// ---------- Nube ----------
export type ModoAcceso = 'login' | 'registro';
export type Sesion = { usuario: string; token: string; clave: string };
export type TextoCifrado = { iv: string; datos: string };

export type TipoPaquete = 'voz' | 'perfil';
export type VozPublica = Omit<Voz, 'id'>;
export type PerfilPublico = { nombre: string; etiqueta: string; voz: VozPublica };
export type Paquete = { id: number; tipo: TipoPaquete; nombre: string; descripcion: string; descargas: number; autor: string };
export type Catalogo = { paquetes: Paquete[]; totales: { tipo: string; total: number }[] };
export type PaqueteDescargado =
  | { tipo: 'voz'; nombre: string; contenido: VozPublica }
  | { tipo: 'perfil'; nombre: string; contenido: PerfilPublico };
export type Publicacion = { tipo: TipoPaquete; nombre: string; descripcion: string; contenido: VozPublica | PerfilPublico };

// ---------- Cómplices y alertas ----------
export type Complice = { usuario: string; aceptado: boolean; enviada: boolean; enLinea: boolean };
export type Alerta = { id: number; de: string; mensaje: string; lat: number | null; lng: number | null; creada: number };
export type Evento = ({ tipo: 'alerta' } & Alerta) | { tipo: 'solicitud' | 'aceptado'; de: string } | { tipo: 'listo' };
export type ResultadoAlerta = { enviadas: number; enLinea: number };
