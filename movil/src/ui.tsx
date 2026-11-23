// Piezas de interfaz que comparten todas las pantallas.
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { intenta } from './estado';

export const C = {
  fondo: '#0d1220', panel: '#131a2b', linea: '#26304a', texto: '#f4f6fb', suave: '#9aa6bd',
  morado: '#8b5cf6', verde: '#10b981', rojo: '#f87171', boton: '#1e2740', campo: '#0b1020',
};

const TRAZOS = {
  inicio: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  regla: 'M12 21s7-6.500 7-12a7 7 0 1 0-14 0c0 5.500 7 12 7 12zM12 11.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
  grafica: 'M4 20V10M10 20V4M16 20v-8M21 20H3',
  tienda: 'M4 8h16l-1 12H5zM8 8a4 4 0 0 1 8 0',
  ajustes: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
  red: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a2.500 2.500 0 1 0 0-5M2 20a6 6 0 0 1 12 0M16 14a5 5 0 0 1 6 5',
  tel: 'M5 3h4l2 5-2.500 1.500a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  campana: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  ojo: 'M3 3l18 18M10 6a9 9 0 0 1 11 6 13 13 0 0 1-3 4M6 7a13 13 0 0 0-3 5 9 9 0 0 0 12 5.500',
};
export type NombreIcono = keyof typeof TRAZOS;
export function Icono({ nombre, color = C.texto, lado = 24, relleno = false }: { nombre: NombreIcono; color?: string; lado?: number; relleno?: boolean }) {
  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24">
      <Path d={TRAZOS[nombre]} fill={relleno ? color : 'none'} stroke={relleno ? 'none' : color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const Titulo = ({ t, sub }: { t: string; sub?: string }) => (
  <View>
    <Text style={e.h1} accessibilityRole="header">{t}</Text>
    {sub && <Text style={e.nota}>{sub}</Text>}
  </View>
);
export const Tarjeta = ({ titulo, boton, children }: { titulo?: string; boton?: ReactNode; children?: ReactNode }) => (
  <View style={e.tarjeta}>
    {titulo && <View style={e.cabeza}><Text style={e.h3}>{titulo}</Text>{boton}</View>}
    {children}
  </View>
);
export const Nota = ({ children }: { children: ReactNode }) => <Text style={e.nota}>{children}</Text>;
export const Texto = ({ children }: { children: ReactNode }) => <Text style={e.texto}>{children}</Text>;
export const Chips = ({ children }: { children: ReactNode }) => <View style={e.chips}>{children}</View>;

type Tono = 'normal' | 'si' | 'peligro';
export function Mini({ t, fn, tono = 'normal', activo }: { t: string; fn: () => unknown; tono?: Tono; activo?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: activo }} onPress={intenta(fn)}
      style={({ pressed }) => [e.mini, (tono === 'si' || activo) && { backgroundColor: '#065f46' }, pressed && { opacity: 0.7 }]}>
      <Text style={[e.miniTexto, tono === 'peligro' && { color: C.rojo }]}>{t}</Text>
    </Pressable>
  );
}
export const Primario = ({ t, fn, ocupado }: { t: string; fn: () => unknown; ocupado?: boolean }) => (
  <Pressable accessibilityRole="button" disabled={ocupado} onPress={intenta(fn)}
    style={({ pressed }) => [e.primario, (pressed || ocupado) && { opacity: 0.6 }]}>
    <Text style={e.primarioTexto}>{t}</Text>
  </Pressable>
);

// Fila de lista: nombre, detalle y botones debajo.
export const Fila = ({ t, sub, primera, children }: { t: string; sub?: string; primera?: boolean; children?: ReactNode }) => (
  <View style={[e.fila, primera && { borderTopWidth: 0, paddingTop: 0 }]}>
    <View>
      <Text style={e.fuerte}>{t}</Text>
      {sub && <Text style={e.chico}>{sub}</Text>}
    </View>
    {children && <Chips>{children}</Chips>}
  </View>
);
// Dos datos en una línea.
export const Par = ({ a, b }: { a: string; b: string | number }) => (
  <View style={e.par}><Text style={[e.texto, { flexShrink: 1 }]}>{a}</Text><Text style={e.chico}>{b}</Text></View>
);
export function Interruptor({ t, valor, fn }: { t: string; valor: boolean; fn: (v: boolean) => unknown }) {
  return (
    <View style={e.interruptor}>
      <Text style={[e.texto, { flex: 1 }]}>{t}</Text>
      <Switch accessibilityLabel={t} value={valor} onValueChange={(v) => intenta(() => fn(v))()}
        trackColor={{ true: C.verde, false: '#3a4666' }} thumbColor="#fff" />
    </View>
  );
}
export function Opciones({ t, opciones, valor, fn }: { t?: string; opciones: [string, string][]; valor: string; fn: (v: string) => unknown }) {
  return (
    <View style={{ gap: 6 }}>
      {t && <Text style={e.nota}>{t}</Text>}
      <Chips>{opciones.map(([v, n]) => <Mini key={v} t={n} activo={v === valor} fn={() => fn(v)} />)}</Chips>
    </View>
  );
}

export function confirmar(pregunta: string, fn: () => unknown, accion = 'Eliminar') {
  Alert.alert('Confirmar', pregunta, [
    { text: 'Cancelar', style: 'cancel' },
    { text: accion, style: 'destructive', onPress: intenta(fn) },
  ]);
}

export const e = StyleSheet.create({
  h1: { color: C.texto, fontSize: 27, fontWeight: '800' },
  h2: { color: C.texto, fontSize: 18, fontWeight: '700', marginTop: 8 },
  h3: { color: C.texto, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  texto: { color: C.texto, fontSize: 15, lineHeight: 21 },
  fuerte: { color: C.texto, fontSize: 16, fontWeight: '700' },
  nota: { color: C.suave, fontSize: 14, lineHeight: 20 },
  chico: { color: C.suave, fontSize: 13 },
  tarjeta: { backgroundColor: C.panel, borderColor: C.linea, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cabeza: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  mini: { backgroundColor: C.boton, borderRadius: 10, paddingHorizontal: 12, minHeight: 42, justifyContent: 'center' },
  miniTexto: { color: C.texto, fontSize: 14 },
  primario: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center' },
  primarioTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fila: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.linea },
  par: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  campo: { backgroundColor: C.campo, borderColor: '#3a4666', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: C.texto, fontSize: 16 },
});
