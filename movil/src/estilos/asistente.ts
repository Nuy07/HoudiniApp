import { StyleSheet } from 'react-native';
import { C } from './tema';

export const s = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  portada: { alignItems: 'center', gap: 10, paddingTop: 18, paddingBottom: 6 },
  saludo: { color: C.texto, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  centro: { textAlign: 'center' },
  ideas: { gap: 8 },
  idea: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.panel, borderColor: C.linea, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  emoji: { fontSize: 20 },
  yo: { alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: C.primario, borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  yoTexto: { color: C.blanco, fontSize: 15, lineHeight: 21 },
  pensando: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barra: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.linea, backgroundColor: C.fondo },
  campo: { flex: 1, maxHeight: 110, minHeight: 46, borderRadius: 23, paddingHorizontal: 16, backgroundColor: C.panel },
  enviar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  apagado: { opacity: 0.4 },
  pie: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 6, color: C.suave, fontSize: 12, textAlign: 'center' },
});

export const t = StyleSheet.create({
  tarjeta: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.linea, backgroundColor: C.panel },
  riesgo: { borderColor: C.rojo },
  cabeza: { padding: 16, gap: 8 },
  titulo: { color: C.blanco, fontSize: 20, fontWeight: '800' },
  origen: { alignSelf: 'flex-start', backgroundColor: '#ffffff2e', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, color: C.blanco, fontSize: 12, overflow: 'hidden' },
  cuerpo: { padding: 16, gap: 14 },
  quien: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.boton, alignItems: 'center', justifyContent: 'center' },
  inicial: { color: C.lila, fontSize: 19, fontWeight: '700' },
  guion: { gap: 6 },
  frase: { alignSelf: 'flex-start', maxWidth: '94%', backgroundColor: C.boton, borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 8, color: C.texto, fontSize: 14, lineHeight: 19, overflow: 'hidden' },
  emergencia: { gap: 8, backgroundColor: '#7f1d1d55', borderRadius: 14, padding: 12 },
});

export const o = StyleSheet.create({
  caja: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: C.halo },
  orbe: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

export const acceso = StyleSheet.create({
  caja: { borderRadius: 18, overflow: 'hidden' },
  fondo: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  titulo: { color: C.blanco, fontSize: 17, fontWeight: '800' },
  sub: { color: '#e9e5ff', fontSize: 14, lineHeight: 19 },
});
