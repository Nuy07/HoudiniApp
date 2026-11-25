import { Pressable, Text, View } from 'react-native';
import { s } from '../../estilos/aplicacion';
import { C } from '../../estilos/tema';
import { Icono } from '../componentes/Icono';
import { useApp } from '../contexto';
import { PESTANAS } from './rutas';

export function Pestanas({ margen }: { margen: number }) {
  const { navegacion } = useApp();
  return (
    <View style={[s.pestanas, { paddingBottom: margen + 6 }]}>
      {PESTANAS.map(({ ruta, icono, texto }) => {
        const elegida = ruta === navegacion.ruta;
        const color = elegida ? C.verde : C.suave;
        return (
          <Pressable key={ruta} accessibilityRole="tab" accessibilityState={{ selected: elegida }} onPress={() => navegacion.ir(ruta)} style={s.pestana}>
            <Icono nombre={icono} color={color} />
            <Text style={[s.pestanaTexto, { color }]}>{texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
