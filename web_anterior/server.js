// HoudiniApp: punto de entrada. Se ejecuta con: npm start
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { crearNube } = require('./servidor/nube');
const { crearTiempoReal } = require('./servidor/tiempo-real');

const PORT = Number(process.env.PORT) || 4000;
const DATOS = process.env.DATOS || path.join(__dirname, 'datos');
fs.mkdirSync(DATOS, { recursive: true });

const nube = crearNube(DATOS);
const tiempoReal = crearTiempoReal(DATOS, nube);
const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; "
      + "style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; "
      + "base-uri 'none'; frame-ancestors 'self'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), { cacheControl: false }));

app.delete('/api/cuenta', nube.requiereSesion, (req, res) => {
  tiempoReal.borrarUsuario(req.usuario.usuario);
  nube.borrarUsuario(req.usuario.id);
  res.status(204).end();
});
app.use('/api', nube.router);
app.use('/api', tiempoReal.router);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.status === 413 ? 'Datos demasiado grandes.' : 'Petición no válida.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const servidor = app.listen(PORT, (error) => {
  if (error) {
    console.error(error.code === 'EADDRINUSE' ? `El puerto ${PORT} ya está ocupado.` : error);
    process.exit(1);
  }
  console.log(`HoudiniApp lista: http://localhost:${PORT}`);
});
const wss = tiempoReal.montar(servidor);
wss.on('error', () => {}); // el error de puerto ya se informa arriba

function cerrar() {
  for (const ws of wss.clients) ws.terminate();
  wss.close();
  servidor.close(() => { nube.cerrar(); tiempoReal.cerrar(); process.exit(0); });
  servidor.closeAllConnections();
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
