import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { alertas, olvidarAlertas, totalEventos } from '../alertas';
import { aviso, formulario } from '../estado';
import { ubicacion } from '../gatillos';
import * as nube from '../nube';
import { Chips, Fila, Mini, Nota, Primario, Tarjeta, Texto, Titulo } from '../ui';

type Complice = { usuario: string; aceptado: boolean; enviada: boolean; enLinea: boolean };

export function pedirAyuda() {
  formulario('Avisar a cómplices', [
    { id: 'mensaje', label: 'Mensaje', valor: 'Necesito que me rescates. Márcame.', max: 200 },
    { id: 'gps', label: 'Incluir mi ubicación', tipo: 'si' },
  ], async (v) => {
    const c = v.gps ? await ubicacion() : null;
    const r = await nube.api<{ enviadas: number; enLinea: number }>('/alertas',
      { metodo: 'POST', datos: { mensaje: v.mensaje, lat: c?.latitude, lng: c?.longitude } });
    aviso(`Alerta enviada a ${r.enviadas} (${r.enLinea} en línea).`);
  });
}
function cuenta(modo: 'login' | 'registro') {
  const nuevo = modo === 'registro';
  formulario(nuevo ? 'Crear cuenta' : 'Iniciar sesión', [
    { id: 'usuario', label: 'Usuario', max: 20 },
    { id: 'clave', label: nuevo ? 'Contraseña (8 o más, no se puede recuperar)' : 'Contraseña', tipo: 'clave' },
  ], (v) => nube.entrar(modo, v.usuario, v.clave));
}
const estadoDe = (c: Complice) =>
  c.aceptado ? (c.enLinea ? 'En línea' : 'Desconectado') : c.enviada ? 'Solicitud enviada' : 'Quiere ser tu cómplice';

function Red() {
  const [lista, setLista] = useState<Complice[] | null>(null);
  const [error, setError] = useState('');
  const [vuelta, setVuelta] = useState(0);
  const recargar = () => setVuelta((v) => v + 1);
  const eventos = totalEventos();

  useEffect(() => {
    let vivo = true;
    nube.api<Complice[]>('/complices')
      .then((l) => { if (vivo) { setLista(l); setError(''); } })
      .catch((x) => { if (vivo) setError(x.message); });
    return () => { vivo = false; };
  }, [eventos, vuelta]);

  const hacer = (ruta: string, metodo: string) => async () => {
    await nube.api(`/complices/${encodeURIComponent(ruta)}`, { metodo });
    recargar();
  };
  const agregar = () => formulario('Agregar cómplice', [{ id: 'usuario', label: 'Usuario', max: 20 }], async (v) => {
    const r = await nube.api<{ mensaje: string }>('/complices', { metodo: 'POST', datos: { usuario: v.usuario } });
    aviso(r.mensaje);
    recargar();
  });
  return (
    <Tarjeta titulo="Mi red" boton={<Mini t="Agregar" fn={agregar} />}>
      {error !== '' ? <><Nota>{error}</Nota><Mini t="Reintentar" fn={recargar} /></> : !lista ? <Nota>Cargando…</Nota>
        : lista.length === 0 ? <Nota>Agrega a alguien por su nombre de usuario.</Nota>
          : lista.map((c, i) => (
            <Fila key={c.usuario} primera={i === 0} t={c.usuario} sub={estadoDe(c)}>
              {!c.aceptado && !c.enviada && <Mini t="Aceptar" tono="si" fn={async () => {
                await nube.api(`/complices/${encodeURIComponent(c.usuario)}/aceptar`, { metodo: 'POST' });
                recargar();
              }} />}
              <Mini t={c.aceptado || c.enviada ? 'Quitar' : 'Rechazar'} tono="peligro" fn={hacer(c.usuario, 'DELETE')} />
            </Fila>
          ))}
    </Tarjeta>
  );
}

export function Complices() {
  const yo = nube.usuario();
  if (!yo) {
    return (
      <>
        <Titulo t="Cómplices" sub="Tu red de rescate en tiempo real." />
        <Tarjeta>
          <Texto>La cuenta solo se usa para cómplices, respaldo y publicar. Lo demás funciona sin ella.</Texto>
          <Chips><Mini t="Iniciar sesión" fn={() => cuenta('login')} /><Mini t="Crear cuenta" tono="si" fn={() => cuenta('registro')} /></Chips>
        </Tarjeta>
      </>
    );
  }
  const recibidas = alertas();
  return (
    <>
      <Titulo t="Cómplices" sub={`Sesión de ${yo}`} />
      <Primario t="Avisar a mi red" fn={pedirAyuda} />
      <Red key={yo} />
      {recibidas.length > 0 && (
        <Tarjeta titulo="Alertas recibidas">
          {recibidas.map((a, i) => (
            <Fila key={a.id} primera={i === 0} t={a.de} sub={`${a.mensaje}\n${new Date(a.creada).toLocaleString('es-MX')}`}>
              {a.lat != null && a.lng != null && <Mini t="Ver mapa"
                fn={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`)} />}
            </Fila>
          ))}
        </Tarjeta>
      )}
      <Chips><Mini t="Cerrar sesión" fn={async () => { await nube.salir(); olvidarAlertas(); }} /></Chips>
    </>
  );
}
