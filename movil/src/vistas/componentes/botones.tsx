import { Pressable, Text } from 'react-native';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/componentes';
import { useIntenta } from '../ganchos/useIntenta';

type Tono = 'normal' | 'si' | 'peligro';
export function Mini({ t, fn, tono = 'normal', activo }: { t: string; fn: () => unknown; tono?: Tono; activo?: boolean }) {
  const intenta = useIntenta();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: activo }} onPress={intenta(fn)}
      style={({ pressed }) => [s.mini, (tono === 'si' || activo) && s.miniActivo, pressed && e.presionado]}>
      <Text style={[s.miniTexto, tono === 'peligro' && s.peligro]}>{t}</Text>
    </Pressable>
  );
}
export function Primario({ t, fn, ocupado }: { t: string; fn: () => unknown; ocupado?: boolean }) {
  const intenta = useIntenta();
  return (
    <Pressable accessibilityRole="button" disabled={ocupado} onPress={intenta(fn)}
      style={({ pressed }) => [s.primario, (pressed || ocupado) && s.primarioOcupado]}>
      <Text style={s.primarioTexto}>{t}</Text>
    </Pressable>
  );
}
