import { Text, View } from 'react-native';
import { nombreAccion, nombreGatillo } from '../../dominio/catalogos';
import { resumenSemanal } from '../../dominio/estadisticas';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/historial';
import { Mini } from '../componentes/botones';
import { Chips, Par, Tarjeta } from '../componentes/cajas';
import { Grafica } from '../componentes/Grafica';
import { Nota, Titulo } from '../componentes/textos';
import { useApp } from '../contexto';
import { useConfirmar } from '../ganchos/useConfirmar';

const Cifra = ({ n, t }: { n: string | number; t: string }) => (
  <View style={[e.tarjeta, s.cifra]}><Text style={s.numero}>{n}</Text><Text style={e.chico}>{t}</Text></View>
);

export function Historial() {
  const { historial, ejemplos } = useApp();
  const confirmar = useConfirmar();
  const total = historial.total();
  const cargar = <Mini t="Cargar datos de ejemplo" fn={() => ejemplos.cargar()} />;
  if (!total) {
    return (
      <>
        <Titulo t="Historial de evasión" />
        <Tarjeta>
          <Nota>Aún no hay escapes. Activa uno para ver tus patrones.</Nota>
          <Chips>{cargar}</Chips>
        </Tarjeta>
      </>
    );
  }
  const deEjemplo = historial.deEjemplo();
  const { dias, porcentajeFinde } = resumenSemanal(historial.porDia(), total);

  return (
    <>
      <Titulo t="Historial de evasión" />
      {deEjemplo > 0 && (
        <View style={e.cabeza}>
          <Text style={s.ejemplo}>Incluye {deEjemplo} registros de ejemplo.</Text>
          <Mini t="Quitar" fn={() => historial.quitarEjemplos()} />
        </View>
      )}
      <View style={s.cifras}>
        <Cifra n={total} t={total === 1 ? 'escape en total' : 'escapes en total'} />
        <Cifra n={`${porcentajeFinde}%`} t="en fin de semana" />
      </View>
      <Tarjeta titulo="Escapes por día"><Grafica dias={dias} /></Tarjeta>
      <Tarjeta titulo="Escapes más usados">{historial.porTipo().map((x) => <Par key={x.clave} a={nombreAccion(x.clave)} b={x.total} />)}</Tarjeta>
      <Tarjeta titulo="Cómo los activaste">{historial.porGatillo().map((x) => <Par key={x.clave} a={nombreGatillo(x.clave)} b={x.total} />)}</Tarjeta>
      <Tarjeta titulo="Recientes">
        {historial.recientes().map((x) => <Par key={x.id} a={`${nombreAccion(x.tipo)}: ${x.detalle}`} b={x.fecha.slice(0, 16)} />)}
      </Tarjeta>
      <Chips>
        {deEjemplo === 0 && cargar}
        <Mini t="Borrar historial" tono="peligro" fn={() => confirmar('¿Borrar todo el historial?', () => historial.borrar(), 'Borrar')} />
      </Chips>
    </>
  );
}
