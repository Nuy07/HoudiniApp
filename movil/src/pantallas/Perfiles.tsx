import type { ReactNode } from 'react';
import { Text } from 'react-native';
import * as db from '../db';
import * as escape from '../escape';
import { aviso, formulario, ir } from '../estado';
import * as nube from '../nube';
import { lineas } from '../textos';
import { confirmar, Fila, Mini, Nota, Tarjeta, Titulo } from '../ui';

// ---------- Formularios ----------
function editarPerfil(p?: db.Perfil) {
  const voces = db.todos<db.Voz>('SELECT * FROM voces ORDER BY nombre');
  if (!voces.length) return aviso('Crea primero una voz.');
  const actual = voces.some((v) => v.id === p?.voz_id) ? p!.voz_id! : voces[0].id;
  formulario(p ? 'Editar perfil' : 'Nuevo perfil', [
    { id: 'nombre', label: 'Nombre de quien llama', valor: p?.nombre, max: 60 },
    { id: 'etiqueta', label: 'Etiqueta (Móvil, Trabajo…)', valor: p?.etiqueta ?? 'Móvil', max: 40 },
    { id: 'voz', label: 'Voz', tipo: 'opciones', valor: actual, opciones: voces.map((v) => [String(v.id), v.nombre]) },
  ], (v) => {
    const datos = [v.nombre, v.etiqueta, Number(v.voz)];
    if (p) db.ejecutar('UPDATE perfiles SET nombre = ?, etiqueta = ?, voz_id = ? WHERE id = ?', [...datos, p.id]);
    else db.ejecutar('INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES (?, ?, ?)', datos);
  });
}
function editarVoz(z?: db.Voz) {
  formulario(z ? 'Editar voz' : 'Nueva voz', [
    { id: 'nombre', label: 'Nombre', valor: z?.nombre, max: 60 },
    { id: 'guion', label: 'Guion (una frase por línea)', tipo: 'area', valor: z && JSON.parse(z.guion).join('\n'), max: 2000 },
    { id: 'rate', label: 'Velocidad (0.5 a 2)', tipo: 'numero', valor: z?.rate ?? 1 },
    { id: 'pitch', label: 'Tono (0.5 a 2)', tipo: 'numero', valor: z?.pitch ?? 1 },
  ], (v) => {
    const guion = lineas(v.guion).map((l) => l.slice(0, 200));
    if (!guion.length) throw new Error('Escribe al menos una frase.');
    const lim = (n: string) => Math.min(2, Math.max(0.5, Number(n)));
    const datos = [v.nombre, lim(v.rate), lim(v.pitch), JSON.stringify(guion)];
    if (z) db.ejecutar('UPDATE voces SET nombre = ?, rate = ?, pitch = ?, guion = ? WHERE id = ?', [...datos, z.id]);
    else db.ejecutar('INSERT INTO voces (nombre, rate, pitch, guion) VALUES (?, ?, ?, ?)', datos);
  });
}
function editarBomba(b?: db.Bomba) {
  formulario(b ? 'Editar bomba' : 'Nueva bomba', [
    { id: 'nombre', label: 'Nombre', valor: b?.nombre, max: 60 },
    { id: 'mensajes', label: 'Mensajes (uno por línea)', tipo: 'area', ayuda: 'Mamá: llámame ya', max: 2000,
      valor: b && JSON.parse(b.mensajes).map((m: db.Mensaje) => `${m.de}: ${m.texto}`).join('\n') },
  ], (v) => {
    const mensajes = lineas(v.mensajes).map((l) => {
      const i = l.indexOf(':');
      if (i < 1 || !l.slice(i + 1).trim()) throw new Error(`Usa el formato "Nombre: mensaje" en: ${l}`);
      return { de: l.slice(0, i).trim(), texto: l.slice(i + 1).trim() };
    });
    if (!mensajes.length) throw new Error('Escribe al menos un mensaje.');
    if (b) db.ejecutar('UPDATE bombas SET nombre = ?, mensajes = ? WHERE id = ?', [v.nombre, JSON.stringify(mensajes), b.id]);
    else db.ejecutar('INSERT INTO bombas (nombre, mensajes) VALUES (?, ?)', [v.nombre, JSON.stringify(mensajes)]);
  });
}
function publicar(tipo: 'voz' | 'perfil', nombre: string, contenido: object) {
  if (!nube.usuario()) { aviso('Inicia sesión para publicar.'); return ir('complices'); }
  formulario('Publicar en la tienda', [
    { id: 'nombre', label: 'Nombre público', valor: nombre, max: 60 },
    { id: 'descripcion', label: 'Descripción', max: 160 },
  ], async (v) => {
    await nube.api('/marketplace', { metodo: 'POST', datos: { tipo, nombre: v.nombre, descripcion: v.descripcion, contenido } });
    aviso('Publicado en la tienda.');
  });
}
const vozComo = (z: db.Voz) => ({ nombre: z.nombre, rate: z.rate, pitch: z.pitch, guion: JSON.parse(z.guion) });

// ---------- Pantalla ----------
const borrar = (tabla: string, f: { id: number; nombre: string }) =>
  confirmar(`¿Eliminar "${f.nombre}"?`, () => db.ejecutar(`DELETE FROM ${tabla} WHERE id = ?`, [f.id]));

function Seccion({ t, nuevo, children }: { t: string; nuevo: () => void; children: ReactNode[] }) {
  return (
    <Tarjeta titulo={t} boton={<Mini t="Agregar" fn={nuevo} />}>
      {children.length ? children : <Nota>Todavía no hay nada aquí.</Nota>}
    </Tarjeta>
  );
}
function Favorito({ clave, f, lista }: { clave: string; f: { id: number }; lista: { id: number }[] }) {
  const elegido = Number(db.config(clave, '0'));
  // Si el elegido ya no existe, cuenta el primero de la lista.
  const vigente = lista.some((x) => x.id === elegido) ? elegido : lista[0].id;
  return vigente === f.id
    ? <Text style={{ color: '#6ee7b7', fontSize: 13, paddingHorizontal: 4 }}>Predeterminado</Text>
    : <Mini t="Usar" fn={() => db.ponerConfig(clave, f.id)} />;
}

export function Perfiles() {
  const perfiles = db.todos<db.Perfil & { voz: string | null }>(`SELECT p.*, v.nombre AS voz FROM perfiles p
    LEFT JOIN voces v ON v.id = p.voz_id ORDER BY p.id`);
  const voces = db.todos<db.Voz>('SELECT * FROM voces ORDER BY id');
  const bombas = db.todos<db.Bomba>('SELECT * FROM bombas ORDER BY id');
  return (
    <>
      <Titulo t="Perfiles" sub="Quién llama, qué dice y qué mensajes llegan." />
      <Seccion t="Perfiles de llamada" nuevo={() => editarPerfil()}>
        {perfiles.map((p, i) => {
          const voz = voces.find((v) => v.id === p.voz_id);
          return (
            <Fila key={p.id} primera={i === 0} t={p.nombre} sub={`${p.etiqueta}, voz: ${p.voz ?? 'básica'}`}>
              <Favorito clave="perfil" f={p} lista={perfiles} />
              <Mini t="Probar" fn={() => escape.llamada('prueba', p.id)} />
              <Mini t="Editar" fn={() => editarPerfil(p)} />
              {voz && <Mini t="Publicar" fn={() => publicar('perfil', p.nombre, { nombre: p.nombre, etiqueta: p.etiqueta, voz: vozComo(voz) })} />}
              <Mini t="Eliminar" tono="peligro" fn={() => borrar('perfiles', p)} />
            </Fila>
          );
        })}
      </Seccion>
      <Seccion t="Voces" nuevo={() => editarVoz()}>
        {voces.map((z, i) => (
          <Fila key={z.id} primera={i === 0} t={z.nombre} sub={`${JSON.parse(z.guion).length} frases`}>
            <Mini t="Editar" fn={() => editarVoz(z)} />
            <Mini t="Publicar" fn={() => publicar('voz', z.nombre, vozComo(z))} />
            <Mini t="Eliminar" tono="peligro" fn={() => borrar('voces', z)} />
          </Fila>
        ))}
      </Seccion>
      <Seccion t="Bombas de notificaciones" nuevo={() => editarBomba()}>
        {bombas.map((b, i) => (
          <Fila key={b.id} primera={i === 0} t={b.nombre} sub={`${JSON.parse(b.mensajes).length} mensajes`}>
            <Favorito clave="bomba" f={b} lista={bombas} />
            <Mini t="Probar" fn={() => escape.bomba('prueba', b.id)} />
            <Mini t="Editar" fn={() => editarBomba(b)} />
            <Mini t="Eliminar" tono="peligro" fn={() => borrar('bombas', b)} />
          </Fila>
        ))}
      </Seccion>
    </>
  );
}
