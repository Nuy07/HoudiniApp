import { StyleSheet } from 'react-native';
import { C } from './tema';

export const s = StyleSheet.create({
  mini: { backgroundColor: C.boton, borderRadius: 10, paddingHorizontal: 12, minHeight: 42, justifyContent: 'center' },
  miniActivo: { backgroundColor: C.activo },
  miniTexto: { color: C.texto, fontSize: 14 },
  peligro: { color: C.rojo },
  primario: { backgroundColor: C.primario, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center' },
  primarioOcupado: { opacity: 0.6 },
  primarioTexto: { color: C.blanco, fontWeight: '700', fontSize: 16 },
  fila: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.linea },
  filaPrimera: { borderTopWidth: 0, paddingTop: 0 },
  par: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
});
