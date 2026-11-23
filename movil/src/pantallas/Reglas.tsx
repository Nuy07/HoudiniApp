import * as db from '../db';
import { formulario } from '../estado';
import * as g from '../gatillos';
import { ACCIONES, nombreAccion } from '../textos';
import { confirmar, Fila, Interruptor, Mini, Nota, Opciones, Tarjeta, Titulo } from '../ui';

function refrescar(id?: number) {
  if (id) g.olvidarRegla(id);
  g.vigilarGps().catch(() => {});
}
function editarRegla(r?: db.Regla) {
  formulario(r ? 'Editar regla' : 'Nueva regla GPS', [
    { id: 'nombre', label: 'Lugar', valor: r?.nombre, ayuda: 'Casa de la tía', max: 60 },
    { id: 'lat', label: 'Latitud', tipo: 'numero', valor: r?.lat },
    { id: 'lng', label: 'Longitud', tipo: 'numero', valor: r?.lng,
      extra: { texto: 'Usar mi ubicación', accion: async () => {
        const c = await g.ubicacion();
        return { lat: c.latitude.toFixed(6), lng: c.longitude.toFixed(6) };
      } } },
    { id: 'radio', label: 'Radio en metros', tipo: 'numero', valor: r?.radio ?? 150 },
    { id: 'accion', label: 'Al llegar', tipo: 'opciones', valor: r?.accion ?? 'llamada', opciones: ACCIONES },
  ], (v) => {
    const [lat, lng, radio] = [Number(v.lat), Number(v.lng), Math.round(Number(v.radio))];
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Coordenadas no válidas.');
    if (radio < 30) throw new Error('El radio mínimo es de 30 metros.');
    const datos = [v.nombre, lat, lng, radio, v.accion];
    if (r) db.ejecutar('UPDATE reglas SET nombre = ?, lat = ?, lng = ?, radio = ?, accion = ? WHERE id = ?', [...datos, r.id]);
    else db.ejecutar('INSERT INTO reglas (nombre, lat, lng, radio, accion) VALUES (?, ?, ?, ?, ?)', datos);
    refrescar(r?.id);
  });
}

export function Reglas() {
  const lista = db.todos<db.Regla>('SELECT * FROM reglas ORDER BY id');
  return (
    <>
      <Titulo t="Automatización" sub="El escape se activa solo cuando llegas a un lugar." />
      <Tarjeta titulo="Reglas por GPS" boton={<Mini t="Agregar" fn={() => editarRegla()} />}>
        {lista.length === 0 && <Nota>Agrega un lugar para automatizar tu escape.</Nota>}
        {lista.map((r, i) => (
          <Fila key={r.id} primera={i === 0} t={r.nombre} sub={`${nombreAccion(r.accion)}, a ${r.radio} m`}>
            <Mini t={r.activa ? 'Activa' : 'Pausada'} tono={r.activa ? 'si' : 'normal'}
              fn={() => { db.ejecutar('UPDATE reglas SET activa = 1 - activa WHERE id = ?', [r.id]); refrescar(r.id); }} />
            <Mini t="Editar" fn={() => editarRegla(r)} />
            <Mini t="Eliminar" tono="peligro" fn={() => confirmar(`¿Eliminar "${r.nombre}"?`, () => {
              db.ejecutar('DELETE FROM reglas WHERE id = ?', [r.id]);
              refrescar(r.id);
            })} />
          </Fila>
        ))}
        <Nota>Funciona sin internet y con la app abierta. Tu ubicación no sale del teléfono.</Nota>
      </Tarjeta>
      <Tarjeta titulo="Gatillos">
        <Interruptor t="Agitar el teléfono" valor={db.config('agitar', '0') === '1'} fn={async (si) => {
          await g.activarAgitar(si);
          db.ponerConfig('agitar', si ? 1 : 0);
        }} />
        <Opciones t="Los gatillos activan" opciones={ACCIONES} valor={db.config('accion', 'llamada')} fn={(v) => db.ponerConfig('accion', v)} />
      </Tarjeta>
    </>
  );
}
