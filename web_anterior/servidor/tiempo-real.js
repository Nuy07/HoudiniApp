// BASE DE DATOS 3: TIEMPO REAL
// Red de cómplices y alertas instantáneas por WebSocket.
// Si el cómplice está desconectado, la alerta se guarda y se entrega al volver.
const path = require('node:path');
const express = require('express');
const Database = require('better-sqlite3');
const { WebSocketServer } = require('ws');

function crearTiempoReal(carpeta, nube) {
  const db = new Database(path.join(carpeta, 'tiempo_real.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS complices (
      solicitante TEXT NOT NULL, destinatario TEXT NOT NULL,
      aceptado INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (solicitante, destinatario)
    );
    CREATE TABLE IF NOT EXISTS alertas (
      id INTEGER PRIMARY KEY, de TEXT NOT NULL, para TEXT NOT NULL, mensaje TEXT NOT NULL,
      lat REAL, lng REAL, creada INTEGER NOT NULL, entregada INTEGER NOT NULL DEFAULT 0
    );
  `);

  const q = {
    lista: db.prepare(`SELECT CASE WHEN solicitante = @u THEN destinatario ELSE solicitante END AS usuario,
      aceptado, solicitante = @u AS enviada FROM complices WHERE solicitante = @u OR destinatario = @u
      ORDER BY aceptado DESC, usuario`),
    vinculo: db.prepare(`SELECT * FROM complices WHERE (solicitante = @a AND destinatario = @b)
      OR (solicitante = @b AND destinatario = @a)`),
    pedir: db.prepare('INSERT INTO complices (solicitante, destinatario) VALUES (?, ?)'),
    aceptar: db.prepare(`UPDATE complices SET aceptado = 1
      WHERE solicitante = ? AND destinatario = ? AND aceptado = 0`),
    quitar: db.prepare(`DELETE FROM complices WHERE (solicitante = @a AND destinatario = @b)
      OR (solicitante = @b AND destinatario = @a)`),
    alertar: db.prepare('INSERT INTO alertas (de, para, mensaje, lat, lng, creada) VALUES (?, ?, ?, ?, ?, ?)'),
    pendientes: db.prepare('SELECT * FROM alertas WHERE para = ? AND entregada = 0 ORDER BY id'),
    recibida: db.prepare('UPDATE alertas SET entregada = 1 WHERE id = ? AND para = ?'),
    // Privacidad: las alertas (pueden llevar ubicación) se borran a los 7 días.
    purgar: db.prepare('DELETE FROM alertas WHERE creada < ?'),
    borrarVinculos: db.prepare('DELETE FROM complices WHERE solicitante = @u OR destinatario = @u'),
    borrarAlertas: db.prepare('DELETE FROM alertas WHERE de = @u OR para = @u'),
  };

  const conexiones = new Map(); // usuario -> Set de sockets

  function enviar(usuario, mensaje) {
    for (const ws of conexiones.get(usuario) ?? []) {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(mensaje));
    }
  }
  const conectado = (u) => (conexiones.get(u)?.size ?? 0) > 0;

  const r = express.Router();
  // Solo estas rutas exigen sesión: las demás siguen hacia el 404.
  const sesion = nube.requiereSesion;

  r.get('/complices', sesion, (req, res) => {
    res.json(q.lista.all({ u: req.usuario.usuario }).map((c) => ({
      usuario: c.usuario, aceptado: Boolean(c.aceptado), enviada: Boolean(c.enviada),
      // El estado en línea solo se comparte si ambos aceptaron.
      enLinea: Boolean(c.aceptado) && conectado(c.usuario),
    })));
  });

  r.post('/complices', sesion, (req, res) => {
    const yo = req.usuario.usuario;
    const otro = String(req.body?.usuario ?? '').trim().toLowerCase();
    if (otro === yo) return res.status(400).json({ error: 'No puedes agregarte a ti.' });
    if (!nube.existe(otro)) return res.status(404).json({ error: 'Ese usuario no existe.' });
    if (q.vinculo.get({ a: yo, b: otro })) return res.status(409).json({ error: 'Ya hay una solicitud o vínculo.' });
    q.pedir.run(yo, otro);
    enviar(otro, { tipo: 'solicitud', de: yo });
    res.status(201).json({ mensaje: 'Solicitud enviada.' });
  });

  r.post('/complices/:usuario/aceptar', sesion, (req, res) => {
    const yo = req.usuario.usuario;
    if (!q.aceptar.run(req.params.usuario, yo).changes) return res.status(404).json({ error: 'No hay solicitud.' });
    enviar(req.params.usuario, { tipo: 'aceptado', de: yo });
    res.json({ mensaje: 'Cómplice agregado.' });
  });

  r.delete('/complices/:usuario', sesion, (req, res) => {
    q.quitar.run({ a: req.usuario.usuario, b: req.params.usuario });
    res.status(204).end();
  });

  const ultima = new Map();
  r.post('/alertas', sesion, (req, res) => {
    const yo = req.usuario.usuario;
    const mensaje = String(req.body?.mensaje ?? '').trim().slice(0, 200);
    if (!mensaje) return res.status(400).json({ error: 'Escribe un mensaje.' });
    if (Date.now() - (ultima.get(yo) ?? 0) < 3000) return res.status(429).json({ error: 'Espera unos segundos.' });
    const { lat, lng } = req.body;
    const conGps = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const destinos = q.lista.all({ u: yo }).filter((c) => c.aceptado);
    if (!destinos.length) return res.status(400).json({ error: 'Aún no tienes cómplices aceptados.' });

    ultima.set(yo, Date.now());
    q.purgar.run(Date.now() - 7 * 86400000);
    for (const { usuario } of destinos) {
      const datos = [yo, usuario, mensaje, conGps ? lat : null, conGps ? lng : null, Date.now()];
      const id = Number(q.alertar.run(...datos).lastInsertRowid);
      enviar(usuario, { tipo: 'alerta', id, de: yo, mensaje, lat: datos[3], lng: datos[4], creada: datos[5] });
    }
    res.status(201).json({ enviadas: destinos.length, enLinea: destinos.filter((d) => conectado(d.usuario)).length });
  });

  function montar(servidor) {
    const wss = new WebSocketServer({ server: servidor, path: '/tiempo-real', maxPayload: 4096 });

    wss.on('connection', (ws) => {
      let usuario = null;
      ws.vivo = true;
      ws.on('pong', () => { ws.vivo = true; });
      ws.on('error', () => ws.terminate());
      const limite = setTimeout(() => usuario || ws.close(4001, 'sin sesion'), 5000);

      ws.on('message', (crudo) => {
        let m;
        try { m = JSON.parse(crudo); } catch { return; }
        if (!m || typeof m !== 'object') return;
        if (!usuario) {
          const u = m.tipo === 'auth' ? nube.porToken(m.token) : null;
          if (!u) return ws.close(4001, 'sesion no valida');
          usuario = u.usuario;
          clearTimeout(limite);
          if (!conexiones.has(usuario)) conexiones.set(usuario, new Set());
          conexiones.get(usuario).add(ws);
          ws.send(JSON.stringify({ tipo: 'listo' }));
          for (const a of q.pendientes.all(usuario)) {
            ws.send(JSON.stringify({ tipo: 'alerta', id: a.id, de: a.de, mensaje: a.mensaje, lat: a.lat, lng: a.lng, creada: a.creada }));
          }
        } else if (m.tipo === 'recibida' && Number.isSafeInteger(m.id)) {
          q.recibida.run(m.id, usuario);
        }
      });

      ws.on('close', () => {
        clearTimeout(limite);
        const grupo = conexiones.get(usuario);
        grupo?.delete(ws);
        if (grupo?.size === 0) conexiones.delete(usuario);
      });
    });

    // Latido: detecta celulares que perdieron la red sin avisar.
    const latido = setInterval(() => {
      for (const ws of wss.clients) {
        if (!ws.vivo) { ws.terminate(); continue; }
        ws.vivo = false;
        ws.ping();
      }
    }, 30000);
    wss.on('close', () => clearInterval(latido));
    return wss;
  }

  return {
    router: r, montar,
    borrarUsuario(u) {
      q.borrarVinculos.run({ u });
      q.borrarAlertas.run({ u });
      for (const ws of conexiones.get(u) ?? []) ws.close(4001, 'cuenta borrada');
    },
    cerrar: () => db.close(),
  };
}

module.exports = { crearTiempoReal };
