// Estilos que comparten varias vistas.
import { StyleSheet } from 'react-native';
import { C } from './tema';

export const e = StyleSheet.create({
  h1: { color: C.texto, fontSize: 27, fontWeight: '800' },
  h2: { color: C.texto, fontSize: 18, fontWeight: '700', marginTop: 8 },
  h3: { color: C.texto, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  texto: { color: C.texto, fontSize: 15, lineHeight: 21 },
  fuerte: { color: C.texto, fontSize: 16, fontWeight: '700' },
  nota: { color: C.suave, fontSize: 14, lineHeight: 20 },
  chico: { color: C.suave, fontSize: 13 },
  error: { color: C.rojo },
  tarjeta: { backgroundColor: C.panel, borderColor: C.linea, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cabeza: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  campo: { backgroundColor: C.campo, borderColor: C.borde, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: C.texto, fontSize: 16 },
  crece: { flex: 1 },
  encoge: { flexShrink: 1 },
  grupo: { gap: 6 },
  presionado: { opacity: 0.7 },
});
