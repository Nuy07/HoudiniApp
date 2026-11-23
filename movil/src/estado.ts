// Estado global mínimo: cuando algo cambia se llama a cambio() y las pantallas se repintan.
import { useSyncExternalStore } from 'react';

let version = 0;
const oyentes = new Set<() => void>();

export function cambio() {
  version++;
  oyentes.forEach((f) => f());
}
export function useCambios() {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => { oyentes.delete(f); }; },
    () => version,
  );
}

// ---------- Navegación ----------
export type Ruta = 'inicio' | 'perfiles' | 'reglas' | 'historial' | 'tienda' | 'complices' | 'ajustes';
let actual: Ruta = 'inicio';
export const ruta = () => actual;
export function ir(r: Ruta) { actual = r; cambio(); }

// ---------- Aviso breve en la parte de abajo ----------
let textoAviso = '';
let reloj: ReturnType<typeof setTimeout>;
export const avisoActual = () => textoAviso;
export function aviso(texto: string) {
  textoAviso = texto;
  clearTimeout(reloj);
  reloj = setTimeout(() => { textoAviso = ''; cambio(); }, 3500);
  cambio();
}

// ---------- Formulario emergente ----------
export type Valores = Record<string, string>;
export type Campo = {
  id: string;
  label: string;
  tipo?: 'texto' | 'area' | 'numero' | 'clave' | 'opciones' | 'si';
  valor?: string | number;
  ayuda?: string;
  max?: number;
  opciones?: [string, string][];
  extra?: { texto: string; accion: () => Promise<Valores> }; // botón que rellena campos
};
export type DatosFormulario = { titulo: string; campos: Campo[]; guardar: (v: Valores) => void | Promise<void> };
let form: DatosFormulario | null = null;
export const formularioActual = () => form;
export function formulario(titulo: string, campos: Campo[], guardar: DatosFormulario['guardar']) {
  form = { titulo, campos, guardar };
  cambio();
}
export function cerrarFormulario(este?: DatosFormulario) {
  // Si al guardar se abrió otro formulario, ese se queda.
  if (este && form !== este) return;
  form = null;
  cambio();
}

// Ejecuta algo asíncrono y muestra su error como aviso.
export const intenta = (fn: () => unknown) => async () => {
  try { await fn(); } catch (e) { aviso((e as Error)?.message || 'Algo salió mal.'); }
};
