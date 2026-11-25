import { ESTILOS_LLAMADA } from '../../dominio/catalogos';
import { Mini } from '../componentes/botones';
import { Chips, Par, Tarjeta } from '../componentes/cajas';
import { Interruptor, Opciones } from '../componentes/entradas';
import { Nota, Titulo } from '../componentes/textos';
import { useApp } from '../contexto';
import { editarServidor, probarServidor } from '../formularios/servidor';
import { useConfirmar } from '../ganchos/useConfirmar';

function AjustesLlamada() {
  const { preferencias, oido, notificaciones, avisos } = useApp();
  const permitir = async () => avisos.mostrar((await notificaciones.permiso(true))
    ? 'Notificaciones activadas.' : 'Permiso no concedido. Actívalo en los ajustes del teléfono.');
  return (
    <Tarjeta titulo="Llamada">
      <Opciones t="Interfaz de llamada" opciones={ESTILOS_LLAMADA} valor={preferencias.leer('estilo', 'auto')} fn={(v) => preferencias.guardar('estilo', v)} />
      <Interruptor t="Audio al acercar al oído" valor={oido.activado} fn={(v) => preferencias.guardar('proximidad', v ? 1 : 0)} />
      <Chips><Mini t="Permitir notificaciones" fn={permitir} /></Chips>
    </Tarjeta>
  );
}

function TripleBase() {
  const { base, cuenta, canal } = useApp();
  return (
    <Tarjeta titulo="Triple base de datos">
      <Par a="SQLite local" b={base.cifrada ? 'Activa y cifrada' : 'Activa'} />
      <Par a="Nube (Supabase)" b={cuenta.usuario ? `Sesión de ${cuenta.usuario}` : 'Sin sesión'} />
      <Par a="Tiempo real (API)" b={canal.enLinea ? 'Conectada' : 'Desconectada'} />
      {!base.cifrada && <Nota>El cifrado local (SQLCipher) solo está en la app compilada, no en Expo Go.</Nota>}
    </Tarjeta>
  );
}

function AjustesIA() {
  const { asistente } = useApp();
  const n = asistente.totalAprendido;
  return (
    <Tarjeta titulo="Houdini IA">
      <Interruptor t="Usar IA en la nube" valor={asistente.permiteNube} fn={(v) => asistente.permitirNube(v)} />
      <Nota>Con sesión, tu texto se envía a Claude. Sin sesión, o apagada, responde la IA del teléfono sin internet.</Nota>
      <Par a="Aprendido de ti" b={n === 1 ? '1 situación' : `${n} situaciones`} />
    </Tarjeta>
  );
}

function Servidor() {
  const app = useApp();
  return (
    <Tarjeta titulo="Servidor" boton={<Mini t="Cambiar" fn={() => editarServidor(app)} />}>
      <Nota>{app.servidor.url}</Nota>
      <Chips>
        <Mini t="Probar conexión" fn={() => probarServidor(app)} />
        {app.servidor.personalizada && <Mini t="Usar Render" fn={() => app.servidor.cambiar('')} />}
      </Chips>
    </Tarjeta>
  );
}

function Respaldo() {
  const { cuenta, respaldo, avisos, navegacion } = useApp();
  const confirmar = useConfirmar();
  const guardar = async () => { await respaldo.respaldar(); avisos.mostrar('Respaldo cifrado guardado.'); };
  const restaurar = () => confirmar('Se reemplazarán los datos de este dispositivo. ¿Continuar?', async () => {
    await respaldo.restaurar();
    avisos.mostrar('Datos restaurados.');
  }, 'Restaurar');
  const borrarCuenta = () => confirmar('Se borran tu cuenta, respaldo, publicaciones y cómplices. No se puede deshacer.', () => cuenta.borrar());
  return (
    <Tarjeta titulo="Respaldo en la nube">
      <Chips>
        {cuenta.usuario ? (
          <>
            <Mini t="Respaldar ahora" fn={guardar} />
            <Mini t="Restaurar" fn={restaurar} />
            <Mini t="Eliminar mi cuenta" tono="peligro" fn={borrarCuenta} />
          </>
        ) : <Mini t="Iniciar sesión" fn={() => navegacion.ir('complices')} />}
      </Chips>
    </Tarjeta>
  );
}

export const Ajustes = () => (
  <>
    <Titulo t="Configuración" />
    <AjustesLlamada />
    <AjustesIA />
    <TripleBase />
    <Servidor />
    <Respaldo />
    <Nota>Las llamadas y mensajes son simulaciones en este dispositivo: no marcan ni escriben a nadie. No sustituye al 911.</Nota>
  </>
);
