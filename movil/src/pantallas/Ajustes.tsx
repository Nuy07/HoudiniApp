import { olvidarAlertas } from '../alertas';
import * as db from '../db';
import { aviso, formulario, ir } from '../estado';
import * as g from '../gatillos';
import * as avisos from '../notificaciones';
import * as nube from '../nube';
import { Chips, confirmar, Interruptor, Mini, Nota, Opciones, Par, Tarjeta, Titulo } from '../ui';

function editarServidor() {
  formulario('Servidor', [
    { id: 'url', label: 'Dirección del servidor Python', valor: nube.servidor(), ayuda: 'http://192.168.1.10:8000', max: 120 },
  ], async (v) => {
    nube.cambiarServidor(v.url);
    await nube.api('/estado');
    aviso('Conectado con el servidor.');
  });
}

export function Ajustes() {
  const yo = nube.usuario();
  return (
    <>
      <Titulo t="Configuración" />
      <Tarjeta titulo="Llamada">
        <Opciones t="Interfaz de llamada" opciones={[['auto', 'Automática'], ['ios', 'Estilo iOS'], ['android', 'Estilo Android']]}
          valor={db.config('estilo', 'auto')} fn={(v) => db.ponerConfig('estilo', v)} />
        <Interruptor t="Audio al acercar al oído" valor={db.config('proximidad', '1') === '1'} fn={(v) => db.ponerConfig('proximidad', v ? 1 : 0)} />
        <Chips><Mini t="Permitir notificaciones" fn={async () =>
          aviso((await avisos.permiso(true)) ? 'Notificaciones activadas.' : 'Permiso no concedido. Actívalo en los ajustes del teléfono.')} /></Chips>
      </Tarjeta>
      <Tarjeta titulo="Triple base de datos">
        <Par a="SQLite local" b={db.cifrada() ? 'Activa y cifrada' : 'Activa'} />
        <Par a="Nube (Python)" b={yo ? `Sesión de ${yo}` : 'Sin sesión'} />
        <Par a="Tiempo real (Python)" b={nube.enLinea() ? 'Conectada' : 'Desconectada'} />
        {!db.cifrada() && <Nota>El cifrado local (SQLCipher) solo está en la app compilada, no en Expo Go.</Nota>}
      </Tarjeta>
      <Tarjeta titulo="Servidor" boton={<Mini t="Cambiar" fn={editarServidor} />}>
        <Nota>{nube.servidor()}</Nota>
        <Chips>
          <Mini t="Probar conexión" fn={async () => { await nube.api('/estado'); aviso('Conectado con el servidor.'); }} />
          {db.config('servidor') !== '' && <Mini t="Usar automático" fn={() => nube.cambiarServidor('')} />}
        </Chips>
      </Tarjeta>
      <Tarjeta titulo="Respaldo en la nube">
        {yo ? (
          <Chips>
            <Mini t="Respaldar ahora" fn={async () => { await nube.respaldar(); aviso('Respaldo cifrado guardado.'); }} />
            <Mini t="Restaurar" fn={() => confirmar('Se reemplazarán los datos de este dispositivo. ¿Continuar?', async () => {
              await nube.recuperar();
              g.olvidarReglas();
              g.vigilarGps().catch(() => {});
              aviso('Datos restaurados.');
            }, 'Restaurar')} />
            <Mini t="Eliminar mi cuenta" tono="peligro" fn={() => confirmar('Se borran tu cuenta, respaldo, publicaciones y cómplices. No se puede deshacer.',
              async () => { await nube.borrarCuenta(); olvidarAlertas(); })} />
          </Chips>
        ) : <Chips><Mini t="Iniciar sesión" fn={() => ir('complices')} /></Chips>}
      </Tarjeta>
      <Nota>Las llamadas y mensajes son simulaciones en este dispositivo: no marcan ni escriben a nadie. No sustituye al 911.</Nota>
    </>
  );
}
