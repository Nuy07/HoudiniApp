import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { s } from '../../estilos/perfiles';
import { Mini } from '../componentes/botones';
import { Fila, Tarjeta } from '../componentes/cajas';
import { Nota, Titulo } from '../componentes/textos';
import { useApp } from '../contexto';
import { editarBomba, editarPerfil, editarVoz, publicarPerfil, publicarVoz } from '../formularios/escapes';
import { useConfirmar } from '../ganchos/useConfirmar';

type Elemento = { id: number; nombre: string };

function Seccion({ t, nuevo, children }: { t: string; nuevo: () => void; children: ReactNode[] }) {
  return (
    <Tarjeta titulo={t} boton={<Mini t="Agregar" fn={nuevo} />}>
      {children.length ? children : <Nota>Todavía no hay nada aquí.</Nota>}
    </Tarjeta>
  );
}
function Favorito({ clave, f, lista }: { clave: 'perfil' | 'bomba'; f: Elemento; lista: Elemento[] }) {
  const { preferencias } = useApp();
  const elegido = Number(preferencias.leer(clave, '0'));
  // Si el elegido ya no existe, cuenta el primero de la lista.
  const vigente = lista.some((x) => x.id === elegido) ? elegido : lista[0].id;
  return vigente === f.id ? <Text style={s.predeterminado}>Predeterminado</Text> : <Mini t="Usar" fn={() => preferencias.guardar(clave, f.id)} />;
}
function Eliminar({ de, f }: { de: { eliminar(id: number): void }; f: Elemento }) {
  const confirmar = useConfirmar();
  return <Mini t="Eliminar" tono="peligro" fn={() => confirmar(`¿Eliminar "${f.nombre}"?`, () => de.eliminar(f.id))} />;
}

export function Perfiles() {
  const app = useApp();
  const perfiles = app.perfiles.listar();
  const voces = app.voces.listar();
  const bombas = app.bombas.listar();
  return (
    <>
      <Titulo t="Perfiles" sub="Quién llama, qué dice y qué mensajes llegan." />
      <Seccion t="Perfiles de llamada" nuevo={() => editarPerfil(app)}>
        {perfiles.map((p, i) => {
          const voz = voces.find((v) => v.id === p.vozId);
          return (
            <Fila key={p.id} primera={i === 0} t={p.nombre} sub={`${p.etiqueta}, voz: ${voz?.nombre ?? 'básica'}`}>
              <Favorito clave="perfil" f={p} lista={perfiles} />
              <Mini t="Probar" fn={() => app.lanzador.lanzar('llamada', 'prueba', p.id)} />
              <Mini t="Editar" fn={() => editarPerfil(app, p)} />
              {voz && <Mini t="Publicar" fn={() => publicarPerfil(app, p, voz)} />}
              <Eliminar de={app.perfiles} f={p} />
            </Fila>
          );
        })}
      </Seccion>
      <Seccion t="Voces" nuevo={() => editarVoz(app)}>
        {voces.map((z, i) => (
          <Fila key={z.id} primera={i === 0} t={z.nombre} sub={`${z.guion.length} frases`}>
            <Mini t="Editar" fn={() => editarVoz(app, z)} />
            <Mini t="Publicar" fn={() => publicarVoz(app, z)} />
            <Eliminar de={app.voces} f={z} />
          </Fila>
        ))}
      </Seccion>
      <Seccion t="Bombas de notificaciones" nuevo={() => editarBomba(app)}>
        {bombas.map((b, i) => (
          <Fila key={b.id} primera={i === 0} t={b.nombre} sub={`${b.mensajes.length} mensajes`}>
            <Favorito clave="bomba" f={b} lista={bombas} />
            <Mini t="Probar" fn={() => app.lanzador.lanzar('bomba', 'prueba', b.id)} />
            <Mini t="Editar" fn={() => editarBomba(app, b)} />
            <Eliminar de={app.bombas} f={b} />
          </Fila>
        ))}
      </Seccion>
    </>
  );
}
