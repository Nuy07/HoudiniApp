import { StyleSheet } from 'react-native';
import { C, LLAMADA } from './tema';

export const s = StyleSheet.create({
  pantalla: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  quien: { alignItems: 'center' },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
  inicial: { color: C.blanco, fontSize: 46 },
  nombre: { color: C.blanco, fontSize: 34, textAlign: 'center' },
  estado: { color: LLAMADA.estado, fontSize: 17, marginTop: 4 },
  enCurso: { gap: 36, width: '100%' },
  acciones: { width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
  boton: { alignItems: 'center', gap: 8, minWidth: 80 },
  circulo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  girado: { transform: [{ rotate: '135deg' }] },
  letra: { fontSize: 24 },
  botonTexto: { color: C.blanco, fontSize: 14 },
  apagada: { backgroundColor: C.negro },
});
