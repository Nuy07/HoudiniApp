import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as db from '../db';
import * as escape from '../escape';
import { intenta, ir } from '../estado';
import * as g from '../gatillos';
import * as nube from '../nube';
import { C, Chips, e, Icono, Mini, Tarjeta, type NombreIcono } from '../ui';
import { nombreAccion } from '../textos';
import { pedirAyuda } from './Complices';

function Opcion({ ico, t, sub, fn }: { ico: NombreIcono; t: string; sub: string; fn: () => unknown }) {
  return (
    <Pressable accessibilityRole="button" onPress={intenta(fn)} style={({ pressed }) => [s.opcion, pressed && { opacity: 0.7 }]}>
      <Icono nombre={ico} color={C.verde} />
      <View style={{ flex: 1 }}><Text style={e.fuerte}>{t}</Text><Text style={e.chico}>{sub}</Text></View>
    </Pressable>
  );
}

export function Inicio() {
  return (
    <>
      <View style={s.portada}>
        <Pressable accessibilityRole="button" accessibilityLabel="Activar escape" onPress={() => escape.lanzarPreferido('boton')}
          style={({ pressed }) => [s.aro, pressed && { transform: [{ scale: 0.96 }] }]}>
          <LinearGradient colors={['#0f766e', '#4f46e5', '#7c3aed']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.boton}>
            <Text style={s.botonTexto}>ACTIVAR{'\n'}ESCAPE</Text>
          </LinearGradient>
        </Pressable>
        <Text style={e.nota}>Acción: {nombreAccion(db.config('accion', 'llamada'))}</Text>
      </View>
      <Text style={e.h2}>Menú rápido</Text>
      <Opcion ico="ojo" t="Rescate discreto" sub="Pantalla negra: 3 toques y suena" fn={() => g.discreto(true)} />
      <Opcion ico="tel" t="Simulación en vivo" sub="Llamada falsa inmediata" fn={() => escape.llamada('menu')} />
      <Opcion ico="campana" t="Bomba de notificaciones" sub="Mensajes urgentes en cadena" fn={() => escape.bomba('menu')} />
      <Opcion ico="red" t="Avisar a cómplices" sub="Alerta instantánea a tu red" fn={() => (nube.usuario() ? pedirAyuda() : ir('complices'))} />
      <Tarjeta titulo="Escape programado">
        <Chips>
          {([[10, '10 s'], [60, '1 min'], [300, '5 min'], [900, '15 min']] as const).map(([seg, t]) => <Mini key={seg} t={t} fn={() => g.programar(seg)} />)}
          <Mini t="Cancelar" tono="peligro" fn={g.cancelarProgramado} />
        </Chips>
      </Tarjeta>
    </>
  );
}

const s = StyleSheet.create({
  portada: { alignItems: 'center', gap: 16, paddingVertical: 16 },
  aro: { padding: 10, borderRadius: 120, backgroundColor: '#8b5cf633' },
  boton: { width: 206, height: 206, borderRadius: 103, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  opcion: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: C.panel, borderColor: C.linea, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
});
