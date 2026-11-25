import { ACCIONES, nombreAccion } from '../../dominio/catalogos';
import type { Regla } from '../../dominio/modelos';
import { Mini } from '../componentes/botones';
import { Fila, Tarjeta } from '../componentes/cajas';
import { Interruptor, Opciones } from '../componentes/entradas';
import { Nota, Titulo } from '../componentes/textos';
import { useApp } from '../contexto';
import { editarRegla } from '../formularios/regla';
import { useConfirmar } from '../ganchos/useConfirmar';

export function Reglas() {
  const app = useApp();
  const confirmar = useConfirmar();
  const { reglas, gps, agitar, preferencias } = app;
  const lista = reglas.listar();

  const alternar = (r: Regla) => {
    reglas.actualizar(r.id, { ...r, activa: !r.activa });
    gps.reglaCambiada(r.id);
  };
  const eliminar = (r: Regla) => confirmar(`¿Eliminar "${r.nombre}"?`, () => {
    reglas.eliminar(r.id);
    gps.reglaCambiada(r.id);
  });

  return (
    <>
      <Titulo t="Automatización" sub="El escape se activa solo cuando llegas a un lugar." />
      <Tarjeta titulo="Reglas por GPS" boton={<Mini t="Agregar" fn={() => editarRegla(app)} />}>
        {lista.length === 0 && <Nota>Agrega un lugar para automatizar tu escape.</Nota>}
        {lista.map((r, i) => (
          <Fila key={r.id} primera={i === 0} t={r.nombre} sub={`${nombreAccion(r.accion)}, a ${r.radio} m`}>
            <Mini t={r.activa ? 'Activa' : 'Pausada'} tono={r.activa ? 'si' : 'normal'} fn={() => alternar(r)} />
            <Mini t="Editar" fn={() => editarRegla(app, r)} />
            <Mini t="Eliminar" tono="peligro" fn={() => eliminar(r)} />
          </Fila>
        ))}
        <Nota>Funciona sin internet y con la app abierta. Tu ubicación no sale del teléfono.</Nota>
      </Tarjeta>
      <Tarjeta titulo="Gatillos">
        <Interruptor t="Agitar el teléfono" valor={agitar.activado} fn={(si) => agitar.cambiar(si)} />
        <Opciones t="Los gatillos activan" opciones={ACCIONES} valor={preferencias.leer('accion', 'llamada')} fn={(v) => preferencias.guardar('accion', v)} />
      </Tarjeta>
    </>
  );
}
