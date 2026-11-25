// La pantalla actual, y las capas que van encima.
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s } from '../estilos/aplicacion';
import { e } from '../estilos/comunes';
import { AvisoBreve } from './capas/AvisoBreve';
import { Burbujas } from './capas/Burbujas';
import { Derivador } from './capas/Derivador';
import { Discreto } from './capas/Discreto';
import { Formulario } from './capas/Formulario';
import { Llamada } from './capas/Llamada';
import { useApp } from './contexto';
import { useBotonAtras } from './ganchos/useBotonAtras';
import { BarraSuperior } from './navegacion/BarraSuperior';
import { Pestanas } from './navegacion/Pestanas';
import { PANTALLAS } from './navegacion/rutas';

export function Aplicacion() {
  const { navegacion, formularios, llamada, discreto, avisos } = useApp();
  const margen = useSafeAreaInsets();
  const Pantalla = PANTALLAS[navegacion.ruta];
  const form = formularios.actual;
  const tapada = Boolean(form || llamada.activo || discreto.activo);

  useBotonAtras(() => {
    if (navegacion.ruta === 'inicio') return false;
    navegacion.ir('inicio');
    return true;
  });

  return (
    <View style={s.app}>
      <StatusBar style="light" />
      {/* Cuando algo la tapa, la pantalla de abajo se oculta a los lectores de pantalla. */}
      <View style={e.crece} importantForAccessibility={tapada ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={tapada}>
        <KeyboardAvoidingView behavior="padding" enabled={!form} style={[e.crece, { paddingTop: margen.top }]}>
          <BarraSuperior />
          <ScrollView key={navegacion.ruta} keyboardShouldPersistTaps="handled" contentContainerStyle={s.contenido}><Pantalla /></ScrollView>
        </KeyboardAvoidingView>
        <Pestanas margen={margen.bottom} />
      </View>

      {form && <Formulario key={form.titulo} datos={form} />}
      <Burbujas arriba={margen.top + 6} />
      {discreto.activo && <Discreto />}
      <Derivador />
      {llamada.datos && <Llamada key={llamada.datos.id} datos={llamada.datos} />}
      {avisos.texto !== '' && !llamada.activo && !discreto.activo && <AvisoBreve texto={avisos.texto} abajo={margen.bottom + 84} />}
    </View>
  );
}
