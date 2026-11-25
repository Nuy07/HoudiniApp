import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { acceso } from '../../../estilos/asistente';
import { e } from '../../../estilos/comunes';
import { DEGRADADO_IA } from '../../../estilos/tema';
import { useContenedor } from '../../contexto';
import { Orbe } from './Orbe';

// Entrada a Houdini IA desde Inicio.
export function AccesoIA() {
  const { navegacion } = useContenedor();
  return (
    <Pressable accessibilityRole="button" onPress={() => navegacion.ir('asistente')} style={({ pressed }) => [acceso.caja, pressed && e.presionado]}>
      <LinearGradient colors={DEGRADADO_IA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={acceso.fondo}>
        <Orbe lado={42} />
        <View style={e.crece}>
          <Text style={acceso.titulo}>Houdini IA</Text>
          <Text style={acceso.sub}>Cuéntale qué pasa y arma tu escape</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
