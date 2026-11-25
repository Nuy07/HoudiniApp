import { Text, View } from 'react-native';
import { s } from '../../estilos/aplicacion';

export const AvisoBreve = ({ texto, abajo }: { texto: string; abajo: number }) => (
  <View pointerEvents="none" style={[s.aviso, { bottom: abajo }]} accessibilityLiveRegion="polite">
    <Text style={s.avisoTexto}>{texto}</Text>
  </View>
);
