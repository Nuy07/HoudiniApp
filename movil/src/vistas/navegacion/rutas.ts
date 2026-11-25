// Qué pantalla abre cada ruta. Para agregar una pantalla basta con registrarla aquí.
import type { ComponentType } from 'react';
import type { Ruta } from '../../estado/Navegacion';
import type { NombreIcono } from '../componentes/Icono';
import { Ajustes } from '../pantallas/Ajustes';
import { Complices } from '../pantallas/Complices';
import { Historial } from '../pantallas/Historial';
import { Inicio } from '../pantallas/Inicio';
import { Perfiles } from '../pantallas/Perfiles';
import { Reglas } from '../pantallas/Reglas';
import { Tienda } from '../pantallas/Tienda';

export const PANTALLAS: Record<Ruta, ComponentType> = {
  inicio: Inicio, perfiles: Perfiles, reglas: Reglas, historial: Historial, tienda: Tienda, complices: Complices, ajustes: Ajustes,
};
export type Enlace = { ruta: Ruta; icono: NombreIcono; texto: string };
export const PESTANAS: Enlace[] = [
  { ruta: 'inicio', icono: 'inicio', texto: 'Inicio' },
  { ruta: 'perfiles', icono: 'perfil', texto: 'Perfiles' },
  { ruta: 'reglas', icono: 'regla', texto: 'Reglas' },
  { ruta: 'historial', icono: 'grafica', texto: 'Historial' },
  { ruta: 'tienda', icono: 'tienda', texto: 'Tienda' },
];
export const SUPERIORES: Enlace[] = [
  { ruta: 'complices', icono: 'red', texto: 'Cómplices' },
  { ruta: 'ajustes', icono: 'ajustes', texto: 'Configuración' },
];
