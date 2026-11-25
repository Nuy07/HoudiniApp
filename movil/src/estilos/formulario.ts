import { StyleSheet } from 'react-native';
import { C } from './tema';

export const s = StyleSheet.create({
  fondo: { backgroundColor: C.velo, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 40 },
  caja: { backgroundColor: C.panel, borderRadius: 18, borderWidth: 1, borderColor: C.linea, flexShrink: 1 },
  contenido: { gap: 14, padding: 20 },
  campo: { gap: 8 },
  area: { minHeight: 110, textAlignVertical: 'top' },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  cancelar: { padding: 12 },
});
