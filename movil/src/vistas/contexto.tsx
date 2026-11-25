// Da a las vistas acceso a los servicios.
import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Contenedor } from '../contenedor';

const Contexto = createContext<Contenedor | null>(null);
export const ProveedorApp = Contexto.Provider;

// Los servicios, sin repintar cuando algo cambia.
export function useContenedor() {
  const app = useContext(Contexto);
  if (!app) throw new Error('Falta ProveedorApp.');
  return app;
}
// Los servicios, y repinta cuando algo cambia.
export function useApp() {
  const app = useContenedor();
  useSyncExternalStore(app.cambios.suscribir, app.cambios.leerVersion);
  return app;
}
