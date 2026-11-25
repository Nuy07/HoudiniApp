// Formularios de la pantalla Perfiles.
import type { Contenedor } from '../../contenedor';
import type { Bomba, Perfil, Voz } from '../../dominio/modelos';
import { escribirMensajes, leerGuion, leerMensajes, limitarTono } from '../../dominio/textos';

export function editarPerfil({ voces, perfiles, formularios, avisos }: Contenedor, p?: Perfil) {
  const lista = voces.listar().sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (!lista.length) return avisos.mostrar('Crea primero una voz.');
  const actual = lista.find((v) => v.id === p?.vozId) ?? lista[0];
  formularios.abrir(p ? 'Editar perfil' : 'Nuevo perfil', [
    { id: 'nombre', label: 'Nombre de quien llama', valor: p?.nombre, max: 60 },
    { id: 'etiqueta', label: 'Etiqueta (Móvil, Trabajo…)', valor: p?.etiqueta ?? 'Móvil', max: 40 },
    { id: 'voz', label: 'Voz', tipo: 'opciones', valor: actual.id, opciones: lista.map((v) => [String(v.id), v.nombre]) },
  ], (v) => {
    const datos = { nombre: v.nombre, etiqueta: v.etiqueta, vozId: Number(v.voz) };
    if (p) perfiles.actualizar(p.id, datos);
    else perfiles.agregar(datos);
  });
}

export function editarVoz({ voces, formularios }: Contenedor, z?: Voz) {
  formularios.abrir(z ? 'Editar voz' : 'Nueva voz', [
    { id: 'nombre', label: 'Nombre', valor: z?.nombre, max: 60 },
    { id: 'guion', label: 'Guion (una frase por línea)', tipo: 'area', valor: z?.guion.join('\n'), max: 2000 },
    { id: 'rate', label: 'Velocidad (0.5 a 2)', tipo: 'numero', valor: z?.rate ?? 1 },
    { id: 'pitch', label: 'Tono (0.5 a 2)', tipo: 'numero', valor: z?.pitch ?? 1 },
  ], (v) => {
    const datos = { nombre: v.nombre, rate: limitarTono(Number(v.rate)), pitch: limitarTono(Number(v.pitch)), guion: leerGuion(v.guion) };
    if (z) voces.actualizar(z.id, datos);
    else voces.agregar(datos);
  });
}

export function editarBomba({ bombas, formularios }: Contenedor, b?: Bomba) {
  formularios.abrir(b ? 'Editar bomba' : 'Nueva bomba', [
    { id: 'nombre', label: 'Nombre', valor: b?.nombre, max: 60 },
    { id: 'mensajes', label: 'Mensajes (uno por línea)', tipo: 'area', ayuda: 'Mamá: llámame ya', max: 2000, valor: b && escribirMensajes(b.mensajes) },
  ], (v) => {
    const datos = { nombre: v.nombre, mensajes: leerMensajes(v.mensajes) };
    if (b) bombas.actualizar(b.id, datos);
    else bombas.agregar(datos);
  });
}

function publicar(app: Contenedor, nombre: string, enviar: (nombre: string, descripcion: string) => Promise<void>) {
  if (!app.cuenta.usuario) { app.avisos.mostrar('Inicia sesión para publicar.'); return app.navegacion.ir('complices'); }
  app.formularios.abrir('Publicar en la tienda', [
    { id: 'nombre', label: 'Nombre público', valor: nombre, max: 60 },
    { id: 'descripcion', label: 'Descripción', max: 160 },
  ], async (v) => {
    await enviar(v.nombre, v.descripcion);
    app.avisos.mostrar('Publicado en la tienda.');
  });
}
export const publicarVoz = (app: Contenedor, z: Voz) => publicar(app, z.nombre, (n, d) => app.tienda.publicarVoz(z, n, d));
export const publicarPerfil = (app: Contenedor, p: Perfil, z: Voz) => publicar(app, p.nombre, (n, d) => app.tienda.publicarPerfil(p, z, n, d));
