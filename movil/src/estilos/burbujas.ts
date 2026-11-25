import { StyleSheet } from 'react-native';
import { C } from './tema';

export const s = StyleSheet.create({
  lista: { position: 'absolute', left: 10, right: 10, gap: 8 },
  burbuja: { flexDirection: 'row', gap: 12, backgroundColor: '#f1f3f9', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, elevation: 6 },
  punto: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  inicial: { color: C.blanco, fontWeight: '700' },
  de: { color: C.fondo, fontWeight: '700', fontSize: 15 },
  texto: { color: C.fondo, fontSize: 15 },
  hora: { color: '#4b5563', fontSize: 12 },
});
