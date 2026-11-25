import { Switch, Text, View } from 'react-native';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/componentes';
import { C } from '../../estilos/tema';
import { useIntenta } from '../ganchos/useIntenta';
import { Mini } from './botones';
import { Chips } from './cajas';

export function Interruptor({ t, valor, fn }: { t: string; valor: boolean; fn: (v: boolean) => unknown }) {
  const intenta = useIntenta();
  return (
    <View style={s.interruptor}>
      <Text style={[e.texto, e.crece]}>{t}</Text>
      <Switch accessibilityLabel={t} value={valor} onValueChange={(v) => intenta(() => fn(v))()}
        trackColor={{ true: C.verde, false: C.borde }} thumbColor={C.blanco} />
    </View>
  );
}
export function Opciones({ t, opciones, valor, fn }: { t?: string; opciones: [string, string][]; valor: string; fn: (v: string) => unknown }) {
  return (
    <View style={e.grupo}>
      {t && <Text style={e.nota}>{t}</Text>}
      <Chips>{opciones.map(([v, n]) => <Mini key={v} t={n} activo={v === valor} fn={() => fn(v)} />)}</Chips>
    </View>
  );
}
