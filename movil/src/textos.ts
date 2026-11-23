export const ACCIONES: [string, string][] = [['llamada', 'Llamada falsa'], ['bomba', 'Bomba de notificaciones']];
export const nombreAccion = (a: string) => ACCIONES.find(([k]) => k === a)?.[1] ?? a;

const GATILLOS: Record<string, string> = {
  boton: 'Botón principal', menu: 'Menú rápido', hardware: 'Teclas de volumen', agitar: 'Agitar',
  discreto: 'Rescate discreto', temporizador: 'Temporizador', gps: 'Regla GPS', prueba: 'Prueba', demo: 'Datos de ejemplo',
};
export const nombreGatillo = (g: string) => GATILLOS[g] ?? g;

// Texto de varias líneas a lista, sin vacías y con máximo 20.
export const lineas = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20);
