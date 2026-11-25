import { Pressable, Text, View } from 'react-native';
import { s } from '../../estilos/aplicacion';
import { C } from '../../estilos/tema';
import { Icono } from '../componentes/Icono';
import { useApp } from '../contexto';
import { SUPERIORES } from './rutas';

export function BarraSuperior() {
  const { navegacion } = useApp();
  return (
    <View style={s.superior}>
      <Text style={s.marca}>HOUDINI <Text style={s.marcaApp}>APP</Text></Text>
      {SUPERIORES.map(({ ruta, icono, texto }) => (
        <Pressable key={ruta} accessibilityRole="button" accessibilityLabel={texto} onPress={() => navegacion.ir(ruta)} style={s.superiorBoton}>
          <Icono nombre={icono} color={navegacion.ruta === ruta ? C.verde : C.texto} />
        </Pressable>
      ))}
    </View>
  );
}
