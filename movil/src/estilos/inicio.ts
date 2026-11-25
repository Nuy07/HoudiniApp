import { StyleSheet } from 'react-native';
import { C } from './tema';

export const s = StyleSheet.create({
  portada: { alignItems: 'center', gap: 16, paddingVertical: 16 },
  aro: { padding: 10, borderRadius: 120, backgroundColor: C.halo },
  aroPresionado: { transform: [{ scale: 0.96 }] },
  boton: { width: 206, height: 206, borderRadius: 103, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: C.blanco, fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  opcion: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: C.panel, borderColor: C.linea, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
});
