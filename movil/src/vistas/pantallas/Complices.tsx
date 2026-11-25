import { Linking } from 'react-native';
import type { Alerta, Complice } from '../../dominio/modelos';
import { Mini, Primario } from '../componentes/botones';
import { Chips, Fila, Tarjeta } from '../componentes/cajas';
import { EsperaServidor } from '../componentes/EsperaServidor';
import { Nota, Texto, Titulo } from '../componentes/textos';
import { useApp } from '../contexto';
import { acceder, agregarComplice, pedirAyuda } from '../formularios/red';
import { useConsulta } from '../ganchos/useConsulta';

const estadoDe = (c: Complice) =>
  c.aceptado ? (c.enLinea ? 'En línea' : 'Desconectado') : c.enviada ? 'Solicitud enviada' : 'Quiere ser tu cómplice';
const abrirMapa = (a: Alerta) =>
  Linking.openURL(`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`);

function SinSesion() {
  const app = useApp();
  return (
    <>
      <Titulo t="Cómplices" sub="Tu red de rescate en tiempo real." />
      <Tarjeta>
        <Texto>La cuenta solo se usa para cómplices, respaldo y publicar. Lo demás funciona sin ella.</Texto>
        <Chips><Mini t="Iniciar sesión" fn={() => acceder(app, 'login')} /><Mini t="Crear cuenta" tono="si" fn={() => acceder(app, 'registro')} /></Chips>
      </Tarjeta>
    </>
  );
}

function Red() {
  const app = useApp();
  const { complices, alertas } = app;
  const { datos, error, recargar } = useConsulta(() => complices.listar(), [alertas.totalEventos]);
  const hacer = (fn: () => Promise<void>) => async () => { await fn(); recargar(); };
  return (
    <Tarjeta titulo="Mi red" boton={<Mini t="Agregar" fn={() => agregarComplice(app, recargar)} />}>
      {error !== '' || !datos ? <EsperaServidor error={error} reintentar={recargar} />
        : datos.length === 0 ? <Nota>Agrega a alguien por su nombre de usuario.</Nota>
          : datos.map((c, i) => (
            <Fila key={c.usuario} primera={i === 0} t={c.usuario} sub={estadoDe(c)}>
              {!c.aceptado && !c.enviada && <Mini t="Aceptar" tono="si" fn={hacer(() => complices.aceptar(c.usuario))} />}
              <Mini t={c.aceptado || c.enviada ? 'Quitar' : 'Rechazar'} tono="peligro" fn={hacer(() => complices.quitar(c.usuario))} />
            </Fila>
          ))}
    </Tarjeta>
  );
}

const Recibidas = ({ lista }: { lista: Alerta[] }) => (
  <Tarjeta titulo="Alertas recibidas">
    {lista.map((a, i) => (
      <Fila key={a.id} primera={i === 0} t={a.de} sub={`${a.mensaje}\n${new Date(a.creada).toLocaleString('es-MX')}`}>
        {a.lat != null && a.lng != null && <Mini t="Ver mapa" fn={() => abrirMapa(a)} />}
      </Fila>
    ))}
  </Tarjeta>
);

export function Complices() {
  const app = useApp();
  const { cuenta, alertas } = app;
  if (!cuenta.usuario) return <SinSesion />;
  return (
    <>
      <Titulo t="Cómplices" sub={`Sesión de ${cuenta.usuario}`} />
      <Primario t="Avisar a mi red" fn={() => pedirAyuda(app)} />
      <Red key={cuenta.usuario} />
      {alertas.recibidas.length > 0 && <Recibidas lista={alertas.recibidas} />}
      <Chips><Mini t="Cerrar sesión" fn={() => cuenta.salir()} /></Chips>
    </>
  );
}
