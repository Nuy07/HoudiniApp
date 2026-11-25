// Mensajes de la bomba de notificaciones.
import { Pressable, Text, View } from 'react-native';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/burbujas';
import { useApp } from '../contexto';

export function Burbujas({ arriba }: { arriba: number }) {
  const { bomba } = useApp();
  return (
    <View pointerEvents="box-none" style={[s.lista, { top: arriba }]}>
      {bomba.burbujas.map((b) => (
        <Pressable key={b.id} onPress={() => bomba.quitar(b.id)} style={s.burbuja}>
          <View style={s.punto}><Text style={s.inicial}>{[...b.de][0]}</Text></View>
          <View style={e.crece}><Text style={s.de}>{b.de}</Text><Text style={s.texto}>{b.texto}</Text></View>
          <Text style={s.hora}>ahora</Text>
        </Pressable>
      ))}
    </View>
  );
}
