import type { Accion } from './modelos';

export const ACCIONES: [Accion, string][] = [['llamada', 'Llamada falsa'], ['bomba', 'Bomba de notificaciones']];
export const nombreAccion = (a: string) => ACCIONES.find(([k]) => k === a)?.[1] ?? a;

const GATILLOS: Record<string, string> = {
  boton: 'Botón principal', menu: 'Menú rápido', hardware: 'Teclas de volumen', agitar: 'Agitar',
  discreto: 'Rescate discreto', temporizador: 'Temporizador', gps: 'Regla GPS', prueba: 'Prueba', ia: 'Asistente IA', demo: 'Datos de ejemplo',
};
export const nombreGatillo = (g: string) => GATILLOS[g] ?? g;

export const ESTILOS_LLAMADA: [string, string][] = [['auto', 'Automática'], ['ios', 'Estilo iOS'], ['android', 'Estilo Android']];
export const TIEMPOS: [number, string][] = [[10, '10 s'], [60, '1 min'], [300, '5 min'], [900, '15 min']];
