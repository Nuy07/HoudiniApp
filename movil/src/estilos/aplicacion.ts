import { StyleSheet } from 'react-native';
import { C } from './tema';

export const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.fondo },
  espera: { flex: 1, backgroundColor: C.fondo, alignItems: 'center', justifyContent: 'center', padding: 24 },
  superior: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  superiorBoton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  marca: { flex: 1, color: C.texto, fontWeight: '800', fontSize: 16, letterSpacing: 0.6 },
  marcaApp: { color: C.lila },
  contenido: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  pestanas: { flexDirection: 'row', backgroundColor: C.panel, borderTopWidth: 1, borderTopColor: C.linea, paddingTop: 6 },
  pestana: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pestanaTexto: { fontSize: 12 },
  aviso: { position: 'absolute', alignSelf: 'center', maxWidth: '92%', backgroundColor: C.texto, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, elevation: 8 },
  avisoTexto: { color: C.fondo, fontSize: 15 },
});
