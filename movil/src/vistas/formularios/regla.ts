import type { Contenedor } from '../../contenedor';
import { ACCIONES } from '../../dominio/catalogos';
import type { Accion, Regla } from '../../dominio/modelos';
import { leerZona } from '../../dominio/textos';

export function editarRegla({ formularios, reglas, ubicacion, gps }: Contenedor, r?: Regla) {
  formularios.abrir(r ? 'Editar regla' : 'Nueva regla GPS', [
    { id: 'nombre', label: 'Lugar', valor: r?.nombre, ayuda: 'Casa de la tía', max: 60 },
    { id: 'lat', label: 'Latitud', tipo: 'numero', valor: r?.lat },
    { id: 'lng', label: 'Longitud', tipo: 'numero', valor: r?.lng,
      extra: { texto: 'Usar mi ubicación', accion: async () => {
        const c = await ubicacion.actual();
        return { lat: c.lat.toFixed(6), lng: c.lng.toFixed(6) };
      } } },
    { id: 'radio', label: 'Radio en metros', tipo: 'numero', valor: r?.radio ?? 150 },
    { id: 'accion', label: 'Al llegar', tipo: 'opciones', valor: r?.accion ?? 'llamada', opciones: ACCIONES },
  ], (v) => {
    const zona = leerZona(Number(v.lat), Number(v.lng), Number(v.radio));
    const datos = { nombre: v.nombre, ...zona, accion: v.accion as Accion, activa: r?.activa ?? true };
    if (r) reglas.actualizar(r.id, datos);
    else reglas.agregar(datos);
    gps.reglaCambiada(r?.id);
  });
}
