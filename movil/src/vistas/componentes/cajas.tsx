import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/componentes';

export const Chips = ({ children }: { children: ReactNode }) => <View style={e.chips}>{children}</View>;

export const Tarjeta = ({ titulo, boton, children }: { titulo?: string; boton?: ReactNode; children?: ReactNode }) => (
  <View style={e.tarjeta}>
    {titulo && <View style={e.cabeza}><Text style={e.h3}>{titulo}</Text>{boton}</View>}
    {children}
  </View>
);
// Fila de lista: nombre, detalle y botones debajo.
export const Fila = ({ t, sub, primera, children }: { t: string; sub?: string; primera?: boolean; children?: ReactNode }) => (
  <View style={[s.fila, primera && s.filaPrimera]}>
    <View>
      <Text style={e.fuerte}>{t}</Text>
      {sub && <Text style={e.chico}>{sub}</Text>}
    </View>
    {children && <Chips>{children}</Chips>}
  </View>
);
// Dos datos en una línea.
export const Par = ({ a, b }: { a: string; b: string | number }) => (
  <View style={s.par}><Text style={[e.texto, e.encoge]}>{a}</Text><Text style={e.chico}>{b}</Text></View>
);
