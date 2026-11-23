// Pantallas de la app.
import * as db from './db.js';
import * as nube from './nube.js';
import * as escape from './escape.js';
import * as g from './gatillos.js';
import { $, h, icono, aviso, formulario } from './ui.js';

const ACCIONES = [['llamada', 'Llamada falsa'], ['bomba', 'Bomba de notificaciones']];
const nombreAccion = (a) => Object.fromEntries(ACCIONES)[a] ?? a;
const GATILLOS = {
  boton: 'Botón principal', menu: 'Menú rápido', hardware: 'Teclas de volumen', agitar: 'Agitar',
  discreto: 'Rescate discreto', temporizador: 'Temporizador', gps: 'Regla GPS', prueba: 'Prueba', demo: 'Datos de ejemplo',
};

let actual = 'inicio';
let alertas = [];

const tarjeta = (...c) => h('section', { class: 'tarjeta' }, ...c);
const titulo = (t, sub) => h('header', { class: 'titulo' }, h('h1', {}, t), sub && h('p', {}, sub));
const vacio = (t) => h('p', { class: 'vacio' }, t);
const mini = (t, fn, clase = '') => h('button', { class: `mini ${clase}`, onclick: fn }, t);

// Ejecuta algo asíncrono y muestra su error como aviso.
const intenta = (fn) => async () => { try { await fn(); } catch (e) { aviso(e.message || 'Algo salió mal.'); } };
const confirmar = (t, fn) => intenta(async () => { if (confirm(t)) await fn(); });

// ---------- Inicio ----------
function inicio() {
  const opcion = (ico, t, sub, fn) => h('button', { class: 'opcion', onclick: fn }, icono(ico),
    h('span', {}, h('strong', {}, t), h('small', {}, sub)));
  return [
    h('div', { class: 'portada' },
      h('button', { class: 'gran-boton', onclick: () => escape.lanzar(db.config('accion', 'llamada'), 'boton') }, 'ACTIVAR', h('br'), 'ESCAPE'),
      h('p', {}, `Acción: ${nombreAccion(db.config('accion', 'llamada'))}`)),
    h('h2', {}, 'Menú rápido'),
    opcion('ojo', 'Rescate discreto', 'Pantalla negra: 3 toques y suena', g.discreto),
    opcion('tel', 'Simulación en vivo', 'Llamada falsa inmediata', () => escape.llamada('menu')),
    opcion('campana', 'Bomba de notificaciones', 'Mensajes urgentes en cadena', () => escape.bomba('menu')),
    opcion('red', 'Avisar a cómplices', 'Alerta instantánea a tu red', () => (nube.usuario() ? pedirAyuda() : ir('complices'))),
    tarjeta(h('h3', {}, 'Escape programado'),
      h('div', { class: 'chips' }, [[10, '10 s'], [60, '1 min'], [300, '5 min'], [900, '15 min']]
        .map(([s, t]) => mini(t, () => g.programar(s))), mini('Cancelar', g.cancelarProgramado, 'peligro'))),
  ];
}

// ---------- Perfiles, voces y bombas ----------
const lineas = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20);

function editarPerfil(p) {
  const voces = db.todos('SELECT id, nombre FROM voces ORDER BY nombre');
  if (!voces.length) return aviso('Crea primero una voz.');
  formulario(p ? 'Editar perfil' : 'Nuevo perfil', [
    { id: 'nombre', label: 'Nombre de quien llama', valor: p?.nombre, max: 60 },
    { id: 'etiqueta', label: 'Etiqueta (Móvil, Trabajo…)', valor: p?.etiqueta ?? 'Móvil', max: 40 },
    { id: 'voz', label: 'Voz', tipo: 'select', valor: p?.voz_id ?? voces[0].id, opciones: voces.map((v) => [v.id, v.nombre]) },
  ], (v) => {
    if (p) db.ejecutar('UPDATE perfiles SET nombre = ?, etiqueta = ?, voz_id = ? WHERE id = ?', [v.nombre, v.etiqueta, Number(v.voz), p.id]);
    else db.ejecutar('INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES (?, ?, ?)', [v.nombre, v.etiqueta, Number(v.voz)]);
    pintar();
  });
}
function editarVoz(z) {
  formulario(z ? 'Editar voz' : 'Nueva voz', [
    { id: 'nombre', label: 'Nombre', valor: z?.nombre, max: 60 },
    { id: 'guion', label: 'Guion (una frase por línea)', tipo: 'textarea', valor: z && JSON.parse(z.guion).join('\n'), max: 2000 },
    { id: 'rate', label: 'Velocidad (0.5 a 2)', tipo: 'number', step: 'any', valor: z?.rate ?? 1 },
    { id: 'pitch', label: 'Tono (0.5 a 2)', tipo: 'number', step: 'any', valor: z?.pitch ?? 1 },
  ], (v) => {
    const guion = lineas(v.guion).map((l) => l.slice(0, 200));
    if (!guion.length) throw new Error('Escribe al menos una frase.');
    const lim = (n) => Math.min(2, Math.max(0.5, Number(n)));
    const datos = [v.nombre, lim(v.rate), lim(v.pitch), JSON.stringify(guion)];
    if (z) db.ejecutar('UPDATE voces SET nombre = ?, rate = ?, pitch = ?, guion = ? WHERE id = ?', [...datos, z.id]);
    else db.ejecutar('INSERT INTO voces (nombre, rate, pitch, guion) VALUES (?, ?, ?, ?)', datos);
    pintar();
  });
}
function editarBomba(b) {
  formulario(b ? 'Editar bomba' : 'Nueva bomba', [
    { id: 'nombre', label: 'Nombre', valor: b?.nombre, max: 60 },
    { id: 'mensajes', label: 'Mensajes (uno por línea)', tipo: 'textarea', ayuda: 'Mamá: llámame ya', max: 2000,
      valor: b && JSON.parse(b.mensajes).map((m) => `${m.de}: ${m.texto}`).join('\n') },
  ], (v) => {
    const mensajes = lineas(v.mensajes).map((l) => {
      const i = l.indexOf(':');
      if (i < 1 || !l.slice(i + 1).trim()) throw new Error(`Usa el formato "Nombre: mensaje" en: ${l}`);
      return { de: l.slice(0, i).trim(), texto: l.slice(i + 1).trim() };
    });
    if (!mensajes.length) throw new Error('Escribe al menos un mensaje.');
    if (b) db.ejecutar('UPDATE bombas SET nombre = ?, mensajes = ? WHERE id = ?', [v.nombre, JSON.stringify(mensajes), b.id]);
    else db.ejecutar('INSERT INTO bombas (nombre, mensajes) VALUES (?, ?)', [v.nombre, JSON.stringify(mensajes)]);
    pintar();
  });
}
function publicar(tipo, nombre, contenido) {
  if (!nube.usuario()) { aviso('Inicia sesión para publicar.'); return ir('complices'); }
  formulario('Publicar en la tienda', [
    { id: 'nombre', label: 'Nombre público', valor: nombre, max: 60 },
    { id: 'descripcion', label: 'Descripción', max: 160 },
  ], async (v) => {
    await nube.api('/marketplace', { metodo: 'POST', datos: { tipo, ...v, contenido } });
    aviso('Publicado en la tienda.');
  });
}
const vozComo = (z) => ({ nombre: z.nombre, rate: z.rate, pitch: z.pitch, guion: JSON.parse(z.guion) });

function perfiles() {
  const borra = (tabla, f) => confirmar(`¿Eliminar "${f.nombre}"?`, () => { db.ejecutar(`DELETE FROM ${tabla} WHERE id = ?`, [f.id]); pintar(); });
  const favorito = (clave, f, primero) => {
    const es = Number(db.config(clave, 0)) === f.id || (!db.uno(`SELECT 1 FROM ${clave === 'perfil' ? 'perfiles' : 'bombas'} WHERE id = ?`, [Number(db.config(clave, 0))]) && primero);
    return es ? h('span', { class: 'etiqueta' }, 'Predeterminado') : mini('Usar', () => { db.ponerConfig(clave, f.id); pintar(); });
  };
  const fila = (f, sub, ...b) => h('li', {}, h('div', {}, h('strong', {}, f.nombre), h('small', {}, sub)), h('div', { class: 'chips' }, ...b));
  const seccion = (t, nuevo, filas) => tarjeta(
    h('div', { class: 'cabeza' }, h('h3', {}, t), mini('Agregar', nuevo)),
    filas.length ? h('ul', { class: 'lista' }, filas) : vacio('Todavía no hay nada aquí.'));

  return [titulo('Perfiles', 'Quién llama, qué dice y qué mensajes llegan.'),
    seccion('Perfiles de llamada', () => editarPerfil(), db.todos(`SELECT p.*, v.nombre AS voz FROM perfiles p
      LEFT JOIN voces v ON v.id = p.voz_id ORDER BY p.id`).map((p, i) => fila(p, `${p.etiqueta}, voz: ${p.voz ?? 'básica'}`,
      favorito('perfil', p, i === 0), mini('Probar', () => escape.llamada('prueba', p.id)), mini('Editar', () => editarPerfil(p)),
      p.voz && mini('Publicar', () => publicar('perfil', p.nombre, { nombre: p.nombre, etiqueta: p.etiqueta,
        voz: vozComo(db.uno('SELECT * FROM voces WHERE id = ?', [p.voz_id])) })),
      mini('Eliminar', borra('perfiles', p), 'peligro')))),
    seccion('Voces', () => editarVoz(), db.todos('SELECT * FROM voces ORDER BY id').map((z) => fila(z, `${JSON.parse(z.guion).length} frases`,
      mini('Editar', () => editarVoz(z)), mini('Publicar', () => publicar('voz', z.nombre, vozComo(z))),
      mini('Eliminar', borra('voces', z), 'peligro')))),
    seccion('Bombas de notificaciones', () => editarBomba(), db.todos('SELECT * FROM bombas ORDER BY id').map((b, i) => fila(b, `${JSON.parse(b.mensajes).length} mensajes`,
      favorito('bomba', b, i === 0), mini('Probar', () => escape.bomba('prueba', b.id)), mini('Editar', () => editarBomba(b)),
      mini('Eliminar', borra('bombas', b), 'peligro')))),
  ];
}

// ---------- Automatización ----------
function editarRegla(r) {
  formulario(r ? 'Editar regla' : 'Nueva regla GPS', [
    { id: 'nombre', label: 'Lugar', valor: r?.nombre, ayuda: 'Casa de la tía', max: 60 },
    { id: 'lat', label: 'Latitud', tipo: 'number', step: 'any', valor: r?.lat },
    { id: 'lng', label: 'Longitud', tipo: 'number', step: 'any', valor: r?.lng,
      extra: (e) => h('button', { type: 'button', class: 'mini', onclick: intenta(async () => {
        const c = await g.ubicacion();
        e.lat.value = c.latitude.toFixed(6); e.lng.value = c.longitude.toFixed(6);
      }) }, 'Usar mi ubicación') },
    { id: 'radio', label: 'Radio en metros', tipo: 'number', valor: r?.radio ?? 150, min: 30 },
    { id: 'accion', label: 'Al llegar', tipo: 'select', valor: r?.accion ?? 'llamada', opciones: ACCIONES },
  ], (v) => {
    const [lat, lng, radio] = [Number(v.lat), Number(v.lng), Math.round(Number(v.radio))];
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Coordenadas no válidas.');
    if (r) {
      db.ejecutar('UPDATE reglas SET nombre = ?, lat = ?, lng = ?, radio = ?, accion = ? WHERE id = ?', [v.nombre, lat, lng, radio, v.accion, r.id]);
      g.olvidarRegla(r.id);
    } else db.ejecutar('INSERT INTO reglas (nombre, lat, lng, radio, accion) VALUES (?, ?, ?, ?, ?)', [v.nombre, lat, lng, radio, v.accion]);
    g.vigilarGps(); pintar();
  });
}
function reglas() {
  const lista = db.todos('SELECT * FROM reglas ORDER BY id');
  return [titulo('Automatización', 'El escape se activa solo cuando llegas a un lugar.'),
    tarjeta(h('div', { class: 'cabeza' }, h('h3', {}, 'Reglas por GPS'), mini('Agregar', () => editarRegla())),
      lista.length ? h('ul', { class: 'lista' }, lista.map((r) => h('li', {},
        h('div', {}, h('strong', {}, r.nombre), h('small', {}, `${nombreAccion(r.accion)}, a ${r.radio} m`)),
        h('div', { class: 'chips' },
          mini(r.activa ? 'Activa' : 'Pausada', () => { db.ejecutar('UPDATE reglas SET activa = 1 - activa WHERE id = ?', [r.id]); g.olvidarRegla(r.id); g.vigilarGps(); pintar(); }, r.activa ? 'si' : ''),
          mini('Editar', () => editarRegla(r)),
          mini('Eliminar', confirmar(`¿Eliminar "${r.nombre}"?`, () => { db.ejecutar('DELETE FROM reglas WHERE id = ?', [r.id]); g.olvidarRegla(r.id); g.vigilarGps(); pintar(); }), 'peligro')))))
        : vacio('Agrega un lugar para automatizar tu escape.'),
      h('p', { class: 'nota' }, 'Funciona sin internet y con la app abierta. Tu ubicación no sale del teléfono.')),
    tarjeta(h('h3', {}, 'Gatillos'),
      interruptor('hardware', 'Teclas de volumen (o tecla V) 3 veces', '1'),
      interruptor('agitar', 'Agitar el teléfono', '0', async (si) => {
        if (!(await g.activarAgitar(si))) throw new Error('No se dio permiso a los sensores.');
      }),
      selector('accion', 'Los gatillos activan', ACCIONES, 'llamada')),
  ];
}

// ---------- Historial (COUNT y GROUP BY) ----------
function historial() {
  const total = db.uno('SELECT COUNT(*) AS n FROM historial').n;
  const hayDemo = db.uno("SELECT COUNT(*) AS n FROM historial WHERE gatillo = 'demo'").n;
  const quitarDemo = () => { db.ejecutar("DELETE FROM historial WHERE gatillo = 'demo'"); pintar(); };
  if (!total) {
    return [titulo('Historial de evasión'), tarjeta(vacio('Aún no hay escapes. Activa uno para ver tus patrones.'),
      mini('Cargar datos de ejemplo', cargarDemo))];
  }
  const porDia = db.todos("SELECT strftime('%w', fecha) AS dia, COUNT(*) AS n FROM historial GROUP BY dia");
  const finde = db.uno("SELECT COUNT(*) AS n FROM historial WHERE strftime('%w', fecha) IN ('0','6')").n;
  const porTipo = db.todos('SELECT tipo, COUNT(*) AS n FROM historial GROUP BY tipo ORDER BY n DESC');
  const porGatillo = db.todos('SELECT gatillo, COUNT(*) AS n FROM historial GROUP BY gatillo ORDER BY n DESC');
  const cuenta = Object.fromEntries(porDia.map((d) => [d.dia, d.n]));
  const dias = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['0', 'Dom']];
  const max = Math.max(...dias.map(([k]) => cuenta[k] ?? 0));

  return [titulo('Historial de evasión'),
    hayDemo > 0 && h('p', { class: 'demo' }, `Incluye ${hayDemo} registros de ejemplo. `, mini('Quitar', quitarDemo)),
    h('div', { class: 'cifras' },
      tarjeta(h('b', {}, total), h('small', {}, total === 1 ? 'escape en total' : 'escapes en total')),
      tarjeta(h('b', {}, `${Math.round((finde / total) * 100)}%`), h('small', {}, 'en fin de semana'))),
    tarjeta(h('h3', {}, 'Escapes por día'),
      h('div', { class: 'leyenda' }, h('span', { class: 'l1' }, 'Entre semana'), h('span', { class: 'l2' }, 'Fin de semana')),
      h('div', { class: 'barras', role: 'img', 'aria-label': dias.map(([k, t]) => `${t}: ${cuenta[k] ?? 0}`).join(', ') },
        dias.map(([k, t]) => {
          const n = cuenta[k] ?? 0;
          return h('div', { class: `barra ${k === '0' || k === '6' ? 'finde' : ''}`, title: `${t}: ${n}` },
            h('small', {}, n), h('i', { style: `height:${(n / max) * 110}px` }), h('span', {}, t));
        }))),
    tabla('Escapes más usados', porTipo.map((x) => [nombreAccion(x.tipo), x.n])),
    tabla('Cómo los activaste', porGatillo.map((x) => [GATILLOS[x.gatillo] ?? x.gatillo, x.n])),
    tarjeta(h('h3', {}, 'Recientes'), h('ul', { class: 'lista simple' },
      db.todos('SELECT * FROM historial ORDER BY fecha DESC, id DESC LIMIT 10').map((x) => h('li', {}, h('span', {}, `${nombreAccion(x.tipo)}: ${x.detalle}`), h('small', {}, x.fecha.slice(0, 16)))))),
    h('div', { class: 'chips' }, !hayDemo && mini('Cargar datos de ejemplo', cargarDemo),
      mini('Borrar historial', confirmar('¿Borrar todo el historial?', () => { db.ejecutar('DELETE FROM historial'); pintar(); }), 'peligro')),
  ];
}
function tabla(t, filas) {
  return tarjeta(h('h3', {}, t), h('table', {}, filas.map(([a, b]) => h('tr', {}, h('td', {}, a), h('td', {}, b)))));
}
function cargarDemo() {
  for (let i = 0; i < 30; i++) {
    db.ejecutar(`INSERT INTO historial (tipo, gatillo, detalle, fecha)
      VALUES (?, 'demo', 'Ejemplo', datetime('now', 'localtime', ?))`, [i % 3 ? 'llamada' : 'bomba', `-${Math.floor(Math.random() * 28)} days`]);
  }
  pintar();
}

// ---------- Tienda ----------
function tienda() {
  const caja = h('div', {}, vacio('Cargando…'));
  const tipo = h('select', { 'aria-label': 'Tipo', onchange: buscar }, [['', 'Todo'], ['voz', 'Voces'], ['perfil', 'Perfiles']].map(([v, t]) => h('option', { value: v }, t)));
  let espera;
  const q = h('input', { type: 'search', placeholder: 'Buscar paquetes', 'aria-label': 'Buscar paquetes', maxlength: 60, oninput: () => { clearTimeout(espera); espera = setTimeout(buscar, 250); } });
  let turno = 0;
  async function buscar() {
    const mio = ++turno;
    try {
      const r = await nube.api(`/marketplace?tipo=${tipo.value}&q=${encodeURIComponent(q.value)}`);
      if (mio !== turno) return;
      const n = Object.fromEntries(r.totales.map((x) => [x.tipo, x.total]));
      caja.replaceChildren(h('p', { class: 'nota' }, `${n.voz ?? 0} voces y ${n.perfil ?? 0} perfiles publicados`),
        r.paquetes.length ? h('ul', { class: 'lista tarjeta' }, r.paquetes.map((p) => h('li', {},
          h('div', {}, h('strong', {}, p.nombre), h('small', {}, p.descripcion), h('small', {}, `${p.tipo === 'voz' ? 'Voz' : 'Perfil'} de ${p.autor}, ${p.descargas} descargas`)),
          h('div', { class: 'chips' }, mini('Descargar', intenta(() => descargar(p.id).then(buscar))),
            p.autor === nube.usuario() && mini('Retirar', confirmar('¿Retirar de la tienda?', async () => { await nube.api(`/marketplace/${p.id}`, { metodo: 'DELETE' }); buscar(); }), 'peligro')))))
          : vacio('No hay paquetes con esa búsqueda.'));
    } catch (e) { if (mio === turno) caja.replaceChildren(vacio(e.message)); }
  }
  buscar();
  return [titulo('Tienda', 'Perfiles y voces de la comunidad.'), h('div', { class: 'buscador' }, q, tipo), caja];
}
async function descargar(id) {
  const { tipo, nombre, contenido: c } = await nube.api(`/marketplace/${id}/descargar`, { metodo: 'POST' });
  const v = tipo === 'voz' ? c : c.voz;
  const voz = db.ejecutar('INSERT INTO voces (nombre, rate, pitch, guion) VALUES (?, ?, ?, ?)', [tipo === 'voz' ? nombre : v.nombre, v.rate, v.pitch, JSON.stringify(v.guion)]);
  db.ejecutar('INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES (?, ?, ?)', [tipo === 'voz' ? nombre : c.nombre, c.etiqueta ?? 'Móvil', voz]);
  aviso('Guardado en Perfiles. Ya funciona sin internet.');
}

// ---------- Cómplices y cuenta ----------
function pedirAyuda() {
  formulario('Avisar a cómplices', [
    { id: 'mensaje', label: 'Mensaje', valor: 'Necesito que me rescates. Márcame.', max: 200 },
    { id: 'gps', label: 'Incluir mi ubicación', tipo: 'checkbox' },
  ], async (v) => {
    const c = v.gps ? await g.ubicacion() : null;
    const r = await nube.api('/alertas', { metodo: 'POST', datos: { mensaje: v.mensaje, lat: c?.latitude, lng: c?.longitude } });
    aviso(`Alerta enviada a ${r.enviadas} (${r.enLinea} en línea).`);
  });
}
function cuenta(modo) {
  const nuevo = modo === 'registro';
  formulario(nuevo ? 'Crear cuenta' : 'Iniciar sesión', [
    { id: 'usuario', label: 'Usuario', max: 20, auto: 'username' },
    { id: 'clave', label: nuevo ? 'Contraseña (8 o más). No se puede recuperar.' : 'Contraseña', tipo: 'password', minimo: 8, auto: nuevo ? 'new-password' : 'current-password' },
  ], async (v) => { await nube.entrar(modo, v.usuario, v.clave); pintar(); });
}
function complices() {
  if (!nube.usuario()) {
    return [titulo('Cómplices', 'Tu red de rescate en tiempo real.'), tarjeta(
      h('p', {}, 'La cuenta solo se usa para cómplices, respaldo y publicar. Lo demás funciona sin ella.'),
      h('div', { class: 'chips' }, mini('Iniciar sesión', () => cuenta('login')), mini('Crear cuenta', () => cuenta('registro'), 'si')))];
  }
  const caja = h('div', {}, vacio('Cargando…'));
  (async () => {
    try {
      const lista = await nube.api('/complices');
      const quitar = (u) => intenta(async () => { await nube.api(`/complices/${u}`, { metodo: 'DELETE' }); pintar(); });
      caja.replaceChildren(lista.length ? h('ul', { class: 'lista' }, lista.map((c) => h('li', {},
        h('div', {}, h('strong', {}, c.usuario), h('small', {}, c.aceptado ? (c.enLinea ? 'En línea' : 'Desconectado') : c.enviada ? 'Solicitud enviada' : 'Quiere ser tu cómplice')),
        h('div', { class: 'chips' },
          !c.aceptado && !c.enviada && mini('Aceptar', intenta(async () => { await nube.api(`/complices/${c.usuario}/aceptar`, { metodo: 'POST' }); pintar(); }), 'si'),
          mini(c.aceptado || c.enviada ? 'Quitar' : 'Rechazar', quitar(c.usuario), 'peligro')))))
        : vacio('Agrega a alguien por su nombre de usuario.'));
    } catch (e) { caja.replaceChildren(vacio(e.message)); if (!nube.usuario()) pintar(); }
  })();
  return [titulo('Cómplices', `Sesión de ${nube.usuario()}`),
    h('button', { class: 'primario ancho', onclick: pedirAyuda }, 'Avisar a mi red'),
    tarjeta(h('div', { class: 'cabeza' }, h('h3', {}, 'Mi red'), mini('Agregar', () => formulario('Agregar cómplice', [{ id: 'usuario', label: 'Usuario', max: 20 }],
      async (v) => { const r = await nube.api('/complices', { metodo: 'POST', datos: v }); aviso(r.mensaje); pintar(); }))), caja),
    alertas.length > 0 && tarjeta(h('h3', {}, 'Alertas recibidas'), h('ul', { class: 'lista' }, alertas.map((a) => h('li', {},
      h('div', {}, h('strong', {}, a.de), h('span', {}, a.mensaje), h('small', {}, new Date(a.creada).toLocaleString('es-MX'))),
      a.lat != null && h('a', { href: `https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`, target: '_blank', rel: 'noopener noreferrer' }, 'Ver mapa'))))),
    mini('Cerrar sesión', intenta(async () => { await nube.salir(); pintar(); })),
  ];
}

// ---------- Ajustes ----------
function interruptor(clave, texto, defecto, alCambiar) {
  const i = h('input', { type: 'checkbox', role: 'switch', checked: db.config(clave, defecto) === '1',
    onchange: intenta(async () => {
      const antes = !i.checked;
      try { await alCambiar?.(i.checked); await db.ponerConfig(clave, i.checked ? 1 : 0); } catch (e) { i.checked = antes; throw e; }
    }) });
  return h('label', { class: 'fila' }, texto, i);
}
function selector(clave, texto, opciones, defecto) {
  const s = h('select', { onchange: () => db.ponerConfig(clave, s.value) }, opciones.map(([v, t]) => h('option', { value: v }, t)));
  s.value = db.config(clave, defecto);
  return h('label', { class: 'campo' }, texto, s);
}
function ajustes() {
  return [titulo('Configuración'),
    tarjeta(h('h3', {}, 'Llamada'),
      selector('estilo', 'Interfaz de llamada', [['auto', 'Automática según el sistema'], ['ios', 'Estilo iOS'], ['android', 'Estilo Android']], 'auto'),
      interruptor('proximidad', 'Audio al acercar al oído', '1'),
      mini('Permitir notificaciones del sistema', intenta(async () => {
        if (!globalThis.Notification) throw new Error('Este navegador no admite notificaciones.');
        aviso((await Notification.requestPermission()) === 'granted' ? 'Notificaciones activadas.' : 'Permiso no concedido.');
      }))),
    tarjeta(h('h3', {}, 'Triple base de datos'),
      h('ul', { class: 'lista simple' },
        h('li', {}, 'SQLite local', h('small', {}, 'Activa, sin internet')),
        h('li', {}, 'Nube', h('small', {}, nube.usuario() ? `Sesión de ${nube.usuario()}` : 'Sin sesión')),
        h('li', {}, 'Tiempo real', h('small', {}, nube.enLinea() ? 'Conectada' : 'Desconectada'))),
      db.hayCifrado() ? interruptor('cifrado', 'Cifrado de datos locales', '1') : h('p', { class: 'nota' }, 'El cifrado necesita HTTPS o localhost.')),
    tarjeta(h('h3', {}, 'Respaldo en la nube'),
      nube.usuario() ? h('div', { class: 'chips' },
        mini('Respaldar ahora', intenta(async () => { await nube.respaldar(); aviso('Respaldo cifrado guardado.'); })),
        mini('Restaurar', confirmar('Se reemplazarán los datos de este dispositivo. ¿Continuar?', async () => { await nube.recuperar(); g.vigilarGps(); aviso('Datos restaurados.'); })),
        mini('Eliminar mi cuenta', confirmar('Se borran tu cuenta, respaldo, publicaciones y cómplices. No se puede deshacer.', async () => { await nube.borrarCuenta(); pintar(); }), 'peligro'))
        : mini('Iniciar sesión', () => ir('complices'))),
    h('p', { class: 'nota' }, 'Las llamadas y mensajes son simulaciones en este dispositivo: no marcan ni escriben a nadie. No sustituye al 911.'),
  ];
}

// ---------- Navegación ----------
const PANTALLAS = { inicio, perfiles, reglas, historial, tienda, complices, ajustes };
function pintar() {
  $('#vista').replaceChildren(...PANTALLAS[actual]().filter(Boolean));
  document.querySelectorAll('[data-ir]').forEach((b) => b.toggleAttribute('aria-current', b.dataset.ir === actual));
}
function ir(p) { actual = p; pintar(); scrollTo(0, 0); }

document.addEventListener('historial', () => { if (actual === 'historial') pintar(); });
document.addEventListener('tiempo-real', ({ detail: m }) => {
  if (m.tipo === 'alerta') {
    if (alertas.some((a) => a.id === m.id)) return;
    alertas = [m, ...alertas].slice(0, 20);
    aviso(`${m.de}: ${m.mensaje}`);
    escape.notificar(`Alerta de ${m.de}`, m.mensaje, `alerta-${m.id}`);
    escape.vibrar([300, 100, 300]);
  } else if (m.tipo === 'solicitud') aviso(`${m.de} quiere ser tu cómplice.`);
  else if (m.tipo === 'aceptado') aviso(`${m.de} aceptó ser tu cómplice.`);
  if (actual === 'complices' || actual === 'ajustes') { if (!document.querySelector('dialog')) pintar(); }
});

async function arrancar() {
  document.querySelectorAll('[data-ir]').forEach((b) => {
    b.prepend(icono(b.dataset.ico));
    b.addEventListener('click', () => ir(b.dataset.ir));
  });
  try {
    await db.iniciar();
    await nube.restaurarSesion();
  } catch (e) {
    console.error(e);
    $('#vista').replaceChildren(vacio('No se pudo abrir la base local. Recarga la página o revisa el modo privado del navegador.'));
    return;
  }
  pintar();
  g.iniciarTeclas();
  g.vigilarGps();
  if (db.config('agitar', '0') === '1' && !globalThis.DeviceMotionEvent?.requestPermission) g.activarAgitar(true);
  navigator.serviceWorker?.register('sw.js').catch(() => {});
}
arrancar();
