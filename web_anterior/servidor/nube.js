// BASE DE DATOS 2: NUBE
// Cuentas, respaldo cifrado de perfiles y marketplace de la comunidad.
const crypto = require('node:crypto');
const path = require('node:path');
const { promisify } = require('node:util');
const express = require('express');
const Database = require('better-sqlite3');

const scrypt = promisify(crypto.scrypt);
const DIAS_SESION = 30;

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const texto = (v, max) =>
  typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null;

function crearNube(carpeta) {
  const db = new Database(path.join(carpeta, 'nube.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY, usuario TEXT NOT NULL UNIQUE,
      sal TEXT NOT NULL, hash TEXT NOT NULL, creado TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sesiones (
      token_hash TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS respaldos (
      usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
      iv TEXT NOT NULL, datos TEXT NOT NULL, actualizado TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS marketplace (
      id INTEGER PRIMARY KEY, tipo TEXT NOT NULL CHECK (tipo IN ('perfil','voz')),
      nombre TEXT NOT NULL, descripcion TEXT NOT NULL, contenido TEXT NOT NULL,
      autor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      descargas INTEGER NOT NULL DEFAULT 0, creado TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sembrar(db);

  const q = {
    usuario: db.prepare('SELECT * FROM usuarios WHERE usuario = ?'),
    crear: db.prepare('INSERT INTO usuarios (usuario, sal, hash) VALUES (?, ?, ?)'),
    borrarUsuario: db.prepare('DELETE FROM usuarios WHERE id = ?'),
    crearSesion: db.prepare('INSERT INTO sesiones VALUES (?, ?, ?)'),
    borrarSesion: db.prepare('DELETE FROM sesiones WHERE token_hash = ?'),
    limpiarSesiones: db.prepare('DELETE FROM sesiones WHERE expira < ?'),
    sesion: db.prepare(`SELECT u.id, u.usuario FROM sesiones s
      JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.expira > ?`),
    leerRespaldo: db.prepare('SELECT iv, datos, actualizado FROM respaldos WHERE usuario_id = ?'),
    guardarRespaldo: db.prepare(`INSERT INTO respaldos (usuario_id, iv, datos) VALUES (?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET iv = excluded.iv, datos = excluded.datos,
      actualizado = CURRENT_TIMESTAMP`),
    tienda: db.prepare(`SELECT m.id, m.tipo, m.nombre, m.descripcion, m.descargas,
        COALESCE(u.usuario, 'HoudiniApp') AS autor
      FROM marketplace m LEFT JOIN usuarios u ON u.id = m.autor_id
      WHERE (@tipo = '' OR m.tipo = @tipo)
        AND (instr(lower(m.nombre), lower(@q)) > 0 OR instr(lower(m.descripcion), lower(@q)) > 0)
      ORDER BY m.descargas DESC, m.id LIMIT 100`),
    totales: db.prepare('SELECT tipo, COUNT(*) AS total FROM marketplace GROUP BY tipo'),
    publicar: db.prepare(`INSERT INTO marketplace (tipo, nombre, descripcion, contenido, autor_id)
      VALUES (?, ?, ?, ?, ?)`),
    contar: db.prepare('UPDATE marketplace SET descargas = descargas + 1 WHERE id = ?'),
    paquete: db.prepare('SELECT tipo, nombre, contenido FROM marketplace WHERE id = ?'),
    retirar: db.prepare('DELETE FROM marketplace WHERE id = ? AND autor_id = ?'),
  };

  function porToken(token) {
    return typeof token === 'string' && token ? q.sesion.get(sha256(token), Date.now()) : undefined;
  }

  // Middleware: exige "Authorization: Bearer <token>".
  function requiereSesion(req, res, next) {
    const token = (req.get('authorization') || '').replace(/^Bearer /, '');
    req.usuario = porToken(token);
    req.token = token;
    if (!req.usuario) return res.status(401).json({ error: 'Inicia sesión primero.' });
    next();
  }

  // Máximo 20 intentos por IP cada 10 minutos en registro y login.
  const intentos = new Map();
  function limitar(req, res, next) {
    const ahora = Date.now();
    if (intentos.size > 5000) intentos.clear();
    const i = intentos.get(req.ip);
    const vigente = i && i.hasta > ahora ? i : { n: 0, hasta: ahora + 600000 };
    vigente.n++;
    intentos.set(req.ip, vigente);
    if (vigente.n > 20) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
    next();
  }

  // La app nunca manda la contraseña: manda una clave derivada (64 hex).
  function credenciales(body) {
    const usuario = String(body?.usuario ?? '').trim().toLowerCase();
    const clave = body?.clave;
    if (!/^[a-z0-9_]{3,20}$/.test(usuario) || typeof clave !== 'string' || !/^[0-9a-f]{64}$/.test(clave)) return null;
    return { usuario, clave };
  }

  function abrirSesion(id) {
    q.limpiarSesiones.run(Date.now());
    const token = crypto.randomBytes(32).toString('hex');
    q.crearSesion.run(sha256(token), id, Date.now() + DIAS_SESION * 86400000);
    return token;
  }

  // El contenido público se valida campo por campo antes de guardarlo.
  function limpiarVoz(v) {
    if (!v || !Array.isArray(v.guion)) return null;
    const guion = v.guion.slice(0, 20).map((l) => texto(l, 200)).filter(Boolean);
    const num = (n, d) => (Number.isFinite(n) ? Math.min(2, Math.max(0.5, n)) : d);
    if (!guion.length) return null;
    return { nombre: texto(v.nombre, 60) || 'Voz', rate: num(v.rate, 1), pitch: num(v.pitch, 1), guion };
  }
  function limpiarContenido(tipo, c) {
    if (tipo === 'voz') return limpiarVoz(c);
    const nombre = texto(c?.nombre, 60);
    const voz = limpiarVoz(c?.voz);
    return nombre && voz ? { nombre, etiqueta: texto(c.etiqueta, 40) || 'Móvil', voz } : null;
  }

  const r = express.Router();

  r.post('/registro', limitar, async (req, res) => {
    const c = credenciales(req.body);
    if (!c) return res.status(400).json({ error: 'Usuario de 3 a 20 letras, números o guion bajo.' });
    const sal = crypto.randomBytes(16).toString('hex');
    const hash = (await scrypt(c.clave, sal, 32)).toString('hex');
    try {
      const { lastInsertRowid } = q.crear.run(c.usuario, sal, hash);
      res.status(201).json({ usuario: c.usuario, token: abrirSesion(lastInsertRowid) });
    } catch (e) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Ese usuario ya existe.' });
      throw e;
    }
  });

  r.post('/login', limitar, async (req, res) => {
    const c = credenciales(req.body);
    const u = c && q.usuario.get(c.usuario);
    // Si no existe se calcula igual, para no revelar qué usuarios hay.
    const hash = await scrypt(c?.clave ?? 'x', u?.sal ?? 'x', 32);
    if (!u || !crypto.timingSafeEqual(hash, Buffer.from(u.hash, 'hex'))) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    res.json({ usuario: u.usuario, token: abrirSesion(u.id) });
  });

  r.post('/salir', requiereSesion, (req, res) => {
    q.borrarSesion.run(sha256(req.token));
    res.status(204).end();
  });

  r.get('/respaldo', requiereSesion, (req, res) => {
    const d = q.leerRespaldo.get(req.usuario.id);
    if (!d) return res.status(404).json({ error: 'Aún no tienes respaldo en la nube.' });
    res.json(d);
  });

  r.put('/respaldo', requiereSesion, (req, res) => {
    const { iv, datos } = req.body || {};
    const b64 = /^[A-Za-z0-9+/]+=*$/;
    if (typeof iv !== 'string' || typeof datos !== 'string' || iv.length > 32 || !b64.test(iv) || !b64.test(datos)) {
      return res.status(400).json({ error: 'Respaldo no válido.' });
    }
    q.guardarRespaldo.run(req.usuario.id, iv, datos);
    res.json({ mensaje: 'Respaldo guardado.' });
  });

  r.get('/marketplace', (req, res) => {
    const tipo = ['perfil', 'voz'].includes(req.query.tipo) ? req.query.tipo : '';
    const busca = typeof req.query.q === 'string' ? req.query.q.slice(0, 60) : '';
    res.json({ paquetes: q.tienda.all({ tipo, q: busca }), totales: q.totales.all() });
  });

  r.post('/marketplace', requiereSesion, (req, res) => {
    const { tipo } = req.body || {};
    const nombre = texto(req.body?.nombre, 60);
    const descripcion = texto(req.body?.descripcion, 160);
    const contenido = ['perfil', 'voz'].includes(tipo) ? limpiarContenido(tipo, req.body.contenido) : null;
    if (!nombre || !descripcion || !contenido) return res.status(400).json({ error: 'Paquete incompleto.' });
    const { lastInsertRowid } = q.publicar.run(tipo, nombre, descripcion, JSON.stringify(contenido), req.usuario.id);
    res.status(201).json({ id: Number(lastInsertRowid) });
  });

  r.post('/marketplace/:id/descargar', (req, res) => {
    const id = Number(req.params.id);
    const p = Number.isSafeInteger(id) ? q.paquete.get(id) : null;
    if (!p) return res.status(404).json({ error: 'Paquete no encontrado.' });
    q.contar.run(id);
    res.json({ tipo: p.tipo, nombre: p.nombre, contenido: JSON.parse(p.contenido) });
  });

  r.delete('/marketplace/:id', requiereSesion, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || !q.retirar.run(id, req.usuario.id).changes) {
      return res.status(404).json({ error: 'No es un paquete tuyo.' });
    }
    res.status(204).end();
  });

  return {
    router: r, porToken, requiereSesion,
    existe: (u) => Boolean(q.usuario.get(u)),
    borrarUsuario: (id) => q.borrarUsuario.run(id),
    cerrar: () => db.close(),
  };
}

// Paquetes iniciales para que la tienda no nazca vacía.
function sembrar(db) {
  if (db.pragma('user_version', { simple: true }) > 0) return;
  const voz = (nombre, rate, pitch, ...guion) => ({ nombre, rate, pitch, guion });
  const voces = [
    ['Emergencia en casa', 'Alguien de la familia necesita que vuelvas ya.', voz('Emergencia en casa', 1.1, 1.1, 'Oye, perdón que te moleste.', 'Se rompió una tubería y se está inundando la cocina.', '¿Puedes venir? No sé dónde está la llave de paso.', 'Gracias, te espero.')],
    ['Compañero de equipo', 'Falla el proyecto minutos antes de entregar.', voz('Compañero de equipo', 1.15, 1, 'Hola, tenemos un problema con el proyecto.', 'La entrega es hoy y el archivo no abre.', 'Necesito que te conectes cuanto antes.')],
    ['Mamá preocupada', 'Clásica, breve y efectiva.', voz('Mamá preocupada', 1, 1.3, '¿Dónde andas, mi amor?', 'Ya es tarde y me prometiste ayudarme.', 'Vente con cuidado, aquí te espero.')],
    ['Vecino con urgencia', 'Tu mascota se salió a la calle.', voz('Vecino con urgencia', 1.05, 0.8, 'Buenas, soy tu vecino.', 'Tu perro se salió y anda en la calle.', 'Yo lo detengo, pero ven pronto.')],
    ['Paquetería', 'Hay que recibir una entrega en persona.', voz('Paquetería', 1, 0.9, 'Buen día, traigo un paquete a su nombre.', 'Necesito que alguien lo reciba y firme.', 'Lo espero diez minutos.')],
    ['Amigo varado', 'Se le quedó el coche y te pide ayuda.', voz('Amigo varado', 1.1, 0.9, '¡Qué bueno que contestas!', 'Se me quedó el coche y no traigo cables.', '¿Me echas la mano? Te mando mi ubicación.')],
  ];
  const perfiles = [
    ['Jefe', 'Llamada de trabajo fuera de horario.', { nombre: 'Jefe', etiqueta: 'Trabajo', voz: voz('Jefe', 1, 0.7, 'Hola, disculpa la hora.', 'El cliente adelantó la reunión.', 'Necesito que revises el reporte ahora mismo.') }],
    ['Roomie', 'Se quedó sin llaves afuera.', { nombre: 'Roomie', etiqueta: 'Móvil', voz: voz('Roomie', 1.1, 1.1, '¡Contesta, por favor!', 'Dejé las llaves adentro y estoy afuera.', '¿Cuánto tardas en llegar?') }],
    ['Hermana', 'Necesita que pases por ella.', { nombre: 'Hermana', etiqueta: 'Casa', voz: voz('Hermana', 1.05, 1.25, 'Oye, ¿ya vienes?', 'Salí temprano y no hay quien me recoja.', 'Ándale, te espero en la entrada.') }],
  ];
  const ins = db.prepare('INSERT INTO marketplace (tipo, nombre, descripcion, contenido) VALUES (?, ?, ?, ?)');
  db.transaction(() => {
    for (const [n, d, c] of voces) ins.run('voz', n, d, JSON.stringify(c));
    for (const [n, d, c] of perfiles) ins.run('perfil', n, d, JSON.stringify(c));
    db.pragma('user_version = 1');
  })();
}

module.exports = { crearNube };
