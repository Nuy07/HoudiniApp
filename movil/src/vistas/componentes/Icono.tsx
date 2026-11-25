import Svg, { Path } from 'react-native-svg';
import { C } from '../../estilos/tema';

const TRAZOS = {
  inicio: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  regla: 'M12 21s7-6.500 7-12a7 7 0 1 0-14 0c0 5.500 7 12 7 12zM12 11.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
  grafica: 'M4 20V10M10 20V4M16 20v-8M21 20H3',
  tienda: 'M4 8h16l-1 12H5zM8 8a4 4 0 0 1 8 0',
  ajustes: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
  red: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a2.500 2.500 0 1 0 0-5M2 20a6 6 0 0 1 12 0M16 14a5 5 0 0 1 6 5',
  tel: 'M5 3h4l2 5-2.500 1.500a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  campana: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  ojo: 'M3 3l18 18M10 6a9 9 0 0 1 11 6 13 13 0 0 1-3 4M6 7a13 13 0 0 0-3 5 9 9 0 0 0 12 5.500',
};
export type NombreIcono = keyof typeof TRAZOS;

type Props = { nombre: NombreIcono; color?: string; lado?: number; relleno?: boolean };
export function Icono({ nombre, color = C.texto, lado = 24, relleno = false }: Props) {
  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24">
      <Path d={TRAZOS[nombre]} fill={relleno ? color : 'none'} stroke={relleno ? 'none' : color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
