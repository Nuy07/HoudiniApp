import { Mini } from './botones';
import { Nota } from './textos';

// Mientras llegan los datos del servidor, o si no llegaron.
export const EsperaServidor = ({ error, reintentar }: { error: string; reintentar: () => unknown }) => (error !== ''
  ? <><Nota>{error}</Nota><Mini t="Reintentar" fn={reintentar} /></>
  : <Nota>Cargando… La primera vez puede tardar un minuto.</Nota>);
