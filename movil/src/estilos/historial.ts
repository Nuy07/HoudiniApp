import { StyleSheet } from 'react-native';
import { C } from './tema';

export const ALTO_BARRA = 110;

export const s = StyleSheet.create({
  ejemplo: { color: C.amarillo, flexShrink: 1 },
  cifras: { flexDirection: 'row', gap: 12 },
  cifra: { flex: 1, gap: 0 },
  numero: { color: C.texto, fontSize: 32, fontWeight: '800' },
  leyendas: { flexDirection: 'row', gap: 16 },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: 10, height: 10, borderRadius: 3 },
  barras: { flexDirection: 'row', alignItems: 'flex-end' },
  columna: { flex: 1, alignItems: 'center' },
  barra: { width: 22, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  eje: { alignSelf: 'stretch', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.linea, paddingTop: 4 },
});
