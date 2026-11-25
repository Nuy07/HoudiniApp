import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { e } from '../../estilos/comunes';

export const Titulo = ({ t, sub }: { t: string; sub?: string }) => (
  <View>
    <Text style={e.h1} accessibilityRole="header">{t}</Text>
    {sub && <Text style={e.nota}>{sub}</Text>}
  </View>
);
export const Nota = ({ children }: { children: ReactNode }) => <Text style={e.nota}>{children}</Text>;
export const Texto = ({ children }: { children: ReactNode }) => <Text style={e.texto}>{children}</Text>;
