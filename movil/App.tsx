// Punto de entrada: arranque, navegación y capas que van encima de las pantallas.
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ComponentType } from 'react';
import { BackHandler, KeyboardAvoidingView, LogBox, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { recibir } from './src/alertas';
import { Discreto } from './src/capas/Discreto';
import { Formulario } from './src/capas/Formulario';
import { Llamada } from './src/capas/Llamada';
import * as db from './src/db';
import * as escape from './src/escape';
import { avisoActual, formularioActual, ir, ruta, useCambios, type Ruta } from './src/estado';
import * as gatillos from './src/gatillos';
import * as notificaciones from './src/notificaciones';
import * as nube from './src/nube';
import { Ajustes } from './src/pantallas/Ajustes';
import { Complices } from './src/pantallas/Complices';
import { Historial } from './src/pantallas/Historial';
import { Inicio } from './src/pantallas/Inicio';
import { Perfiles } from './src/pantallas/Perfiles';
import { Reglas } from './src/pantallas/Reglas';
import { Tienda } from './src/pantallas/Tienda';
import { C, e, Icono, type NombreIcono } from './src/ui';

// Expo Go avisa que no hay notificaciones push (esta app no las usa) y en Android no deja
// crear canales: ahí las notificaciones salen por el canal general.
LogBox.ignoreLogs([/expo-notifications/, /Canal de notificaciones/]);

const PANTALLAS: Record<Ruta, ComponentType> = {
  inicio: Inicio, perfiles: Perfiles, reglas: Reglas, historial: Historial, tienda: Tienda, complices: Complices, ajustes: Ajustes,
};
const PESTANAS: [Ruta, NombreIcono, string][] = [
  ['inicio', 'inicio', 'Inicio'], ['perfiles', 'perfil', 'Perfiles'], ['reglas', 'regla', 'Reglas'],
  ['historial', 'grafica', 'Historial'], ['tienda', 'tienda', 'Tienda'],
];

async function arrancar() {
  db.iniciar();
  escape.prepararAudio();
  await notificaciones.iniciar().catch((x) => console.warn('Canal de notificaciones:', x));
  await nube.iniciar(recibir);
  gatillos.iniciar();
  notificaciones.alTocar((tipo) => {
    if (tipo === 'programado') gatillos.dispararProgramado();
    if (tipo === 'alerta') ir('complices');
  });
}

function BotonSuperior({ a, ico, texto }: { a: Ruta; ico: NombreIcono; texto: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={texto} onPress={() => ir(a)} style={s.superiorBoton}>
      <Icono nombre={ico} color={ruta() === a ? C.verde : C.texto} />
    </Pressable>
  );
}

function Contenido() {
  useCambios();
  const margen = useSafeAreaInsets();
  const actual = ruta();
  const Pantalla = PANTALLAS[actual];
  const form = formularioActual();
  const llamada = escape.llamadaActual();
  const aviso = avisoActual();
  const tapada = Boolean(form || llamada || gatillos.discretoActivo());

  useEffect(() => {
    const atras = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ruta() === 'inicio') return false;
      ir('inicio');
      return true;
    });
    return () => atras.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <StatusBar style="light" />
      {/* Cuando algo la tapa, la pantalla de abajo se oculta a los lectores de pantalla. */}
      <View style={{ flex: 1 }} importantForAccessibility={tapada ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={tapada}>
      <KeyboardAvoidingView behavior="padding" enabled={!form} style={{ flex: 1, paddingTop: margen.top }}>
        <View style={s.superior}>
          <Text style={s.marca}>HOUDINI <Text style={{ color: '#a78bfa' }}>APP</Text></Text>
          <BotonSuperior a="complices" ico="red" texto="Cómplices" />
          <BotonSuperior a="ajustes" ico="ajustes" texto="Configuración" />
        </View>
        <ScrollView key={actual} keyboardShouldPersistTaps="handled" contentContainerStyle={s.contenido}><Pantalla /></ScrollView>
      </KeyboardAvoidingView>
      <View style={[s.pestanas, { paddingBottom: margen.bottom + 6 }]}>
        {PESTANAS.map(([r, ico, t]) => {
          const color = r === actual ? C.verde : C.suave;
          return (
            <Pressable key={r} accessibilityRole="tab" accessibilityState={{ selected: r === actual }} onPress={() => ir(r)} style={s.pestana}>
              <Icono nombre={ico} color={color} />
              <Text style={{ color, fontSize: 12 }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      </View>

      {form && <Formulario key={form.titulo} datos={form} />}
      <View pointerEvents="box-none" style={[s.burbujas, { top: margen.top + 6 }]}>
        {escape.burbujasActuales().map((b) => (
          <Pressable key={b.id} onPress={() => escape.quitarBurbuja(b.id)} style={s.burbuja}>
            <View style={s.punto}><Text style={{ color: '#fff', fontWeight: '700' }}>{[...b.de][0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.burbujaDe}>{b.de}</Text><Text style={s.burbujaTexto}>{b.texto}</Text></View>
            <Text style={s.burbujaHora}>ahora</Text>
          </Pressable>
        ))}
      </View>
      {gatillos.discretoActivo() && <Discreto />}
      {llamada && <Llamada key={llamada.id} datos={llamada} />}
      {aviso !== '' && !llamada && !gatillos.discretoActivo() && (
        <View pointerEvents="none" style={[s.aviso, { bottom: margen.bottom + 84 }]} accessibilityLiveRegion="polite">
          <Text style={{ color: C.fondo, fontSize: 15 }}>{aviso}</Text>
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando');
  useEffect(() => {
    arrancar().then(() => setEstado('lista'), (x) => { console.error(x); setEstado('error'); });
  }, []);
  return (
    <SafeAreaProvider style={{ backgroundColor: C.fondo }}>
      {estado === 'lista' ? <Contenido /> : (
        <View style={s.espera}>
          <StatusBar style="light" />
          <Text style={e.nota}>{estado === 'error' ? 'No se pudo abrir la base local. Cierra la app y ábrela de nuevo.' : 'Cargando…'}</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  espera: { flex: 1, backgroundColor: C.fondo, alignItems: 'center', justifyContent: 'center', padding: 24 },
  superior: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  superiorBoton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  marca: { flex: 1, color: C.texto, fontWeight: '800', fontSize: 16, letterSpacing: 0.6 },
  contenido: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  pestanas: { flexDirection: 'row', backgroundColor: C.panel, borderTopWidth: 1, borderTopColor: C.linea, paddingTop: 6 },
  pestana: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 2 },
  burbujas: { position: 'absolute', left: 10, right: 10, gap: 8 },
  burbuja: { flexDirection: 'row', gap: 12, backgroundColor: '#f1f3f9', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, elevation: 6 },
  punto: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  burbujaDe: { color: C.fondo, fontWeight: '700', fontSize: 15 },
  burbujaTexto: { color: C.fondo, fontSize: 15 },
  burbujaHora: { color: '#4b5563', fontSize: 12 },
  aviso: { position: 'absolute', alignSelf: 'center', maxWidth: '92%', backgroundColor: '#f4f6fb', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, elevation: 8 },
});
