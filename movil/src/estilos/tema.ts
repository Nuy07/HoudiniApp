// Colores de toda la app.
export const C = {
  fondo: '#0d1220', panel: '#131a2b', linea: '#26304a', texto: '#f4f6fb', suave: '#9aa6bd',
  morado: '#8b5cf6', verde: '#10b981', rojo: '#f87171', boton: '#1e2740', campo: '#0b1020',
  primario: '#7c3aed', lila: '#a78bfa', halo: '#8b5cf633', borde: '#3a4666', activo: '#065f46', predeterminado: '#6ee7b7',
  finde: '#0e9f6e', amarillo: '#fcd34d', marcador: '#68748d', blanco: '#fff', negro: '#000', velo: '#000b',
};

export const DEGRADADO_BOTON = ['#0f766e', '#4f46e5', '#7c3aed'] as const;

export const DEGRADADO_IA = ['#312e81', '#6d28d9'] as const;
export const DEGRADADO_RIESGO = ['#7f1d1d', '#b91c1c'] as const;

// Colores de la llamada, según el sistema que imita.
export const LLAMADA = {
  ios: { fondo: ['#3b4252', '#15181f'], avatar: '#6b7280' },
  android: { fondo: ['#10151c', '#10151c'], avatar: '#1a73e8' },
  colgar: '#e0352b', contestar: '#22a047', alternar: '#ffffff26', estado: '#d1d5db',
} as const;
