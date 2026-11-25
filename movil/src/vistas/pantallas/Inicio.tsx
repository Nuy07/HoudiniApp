import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { nombreAccion, TIEMPOS } from '../../dominio/catalogos';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/inicio';
import { C, DEGRADADO_BOTON } from '../../estilos/tema';
import { AccesoIA } from '../componentes/asistente/AccesoIA';
import { Mini } from '../componentes/botones';
import { Chips, Tarjeta } from '../componentes/cajas';
import { Icono, type NombreIcono } from '../componentes/Icono';
import { useApp } from '../contexto';
import { pedirAyuda } from '../formularios/red';
import { useIntenta } from '../ganchos/useIntenta';

function Opcion({ ico, t, sub, fn }: { ico: NombreIcono; t: string; sub: string; fn: () => unknown }) {
  const intenta = useIntenta();
  return (
    <Pressable accessibilityRole="button" onPress={intenta(fn)} style={({ pressed }) => [s.opcion, pressed && e.presionado]}>
      <Icono nombre={ico} color={C.verde} />
      <View style={e.crece}><Text style={e.fuerte}>{t}</Text><Text style={e.chico}>{sub}</Text></View>
    </Pressable>
  );
}

export function Inicio() {
  const app = useApp();
  const { lanzador, discreto, temporizador, preferencias } = app;
  return (
    <>
      <View style={s.portada}>
        <Pressable accessibilityRole="button" accessibilityLabel="Activar escape" onPress={() => lanzador.lanzarPreferido('boton')}
          style={({ pressed }) => [s.aro, pressed && s.aroPresionado]}>
          <LinearGradient colors={DEGRADADO_BOTON} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.boton}>
            <Text style={s.botonTexto}>ACTIVAR{'\n'}ESCAPE</Text>
          </LinearGradient>
        </Pressable>
        <Text style={e.nota}>Acción: {nombreAccion(preferencias.leer('accion', 'llamada'))}</Text>
      </View>
      <AccesoIA />
      <Text style={e.h2}>Menú rápido</Text>
      <Opcion ico="ojo" t="Rescate discreto" sub="Pantalla negra: 3 toques y suena" fn={() => discreto.entrar()} />
      <Opcion ico="tel" t="Simulación en vivo" sub="Llamada falsa inmediata" fn={() => lanzador.lanzar('llamada', 'menu')} />
      <Opcion ico="campana" t="Bomba de notificaciones" sub="Mensajes urgentes en cadena" fn={() => lanzador.lanzar('bomba', 'menu')} />
      <Opcion ico="red" t="Avisar a cómplices" sub="Alerta instantánea a tu red"
        fn={() => (app.cuenta.usuario ? pedirAyuda(app) : app.navegacion.ir('complices'))} />
      <Tarjeta titulo="Escape programado">
        <Chips>
          {TIEMPOS.map(([seg, t]) => <Mini key={seg} t={t} fn={() => temporizador.programar(seg)} />)}
          <Mini t="Cancelar" tono="peligro" fn={() => temporizador.cancelar()} />
        </Chips>
      </Tarjeta>
    </>
  );
}
