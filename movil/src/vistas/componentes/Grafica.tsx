import { Text, View } from 'react-native';
import type { resumenSemanal } from '../../dominio/estadisticas';
import { e } from '../../estilos/comunes';
import { ALTO_BARRA, s } from '../../estilos/historial';
import { C } from '../../estilos/tema';

type Dia = ReturnType<typeof resumenSemanal>['dias'][number];
const LEYENDA = [[C.morado, 'Entre semana'], [C.finde, 'Fin de semana']];

export const Grafica = ({ dias }: { dias: Dia[] }) => (
  <>
    <View style={s.leyendas}>
      {LEYENDA.map(([color, t]) => (
        <View key={t} style={s.leyenda}><View style={[s.punto, { backgroundColor: color }]} /><Text style={e.chico}>{t}</Text></View>
      ))}
    </View>
    <View style={s.barras} accessible accessibilityRole="image" accessibilityLabel={dias.map((d) => `${d.nombre}: ${d.total}`).join(', ')}>
      {dias.map((d) => (
        <View key={d.clave} style={s.columna}>
          <Text style={e.chico}>{d.total}</Text>
          <View style={[s.barra, { height: d.proporcion * ALTO_BARRA, backgroundColor: d.finde ? C.finde : C.morado }]} />
          <View style={s.eje}><Text style={e.chico}>{d.nombre}</Text></View>
        </View>
      ))}
    </View>
  </>
);
