// Cuida que las capas no se mezclen: npm run revisar
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
// Qué puede usar cada capa. "externo" = React, Expo y demás librerías.
const PERMITE = {
  dominio: ['dominio'],
  servicios: ['dominio', 'servicios'],
  estado: ['dominio', 'estado'],
  infraestructura: ['dominio', 'infraestructura', 'externo'],
  estilos: ['estilos', 'externo'],
  vistas: ['dominio', 'estado', 'estilos', 'vistas', 'contenedor', 'externo'],
};
// El WebView necesita conocer los pedidos de su derivador.
const EXCEPCIONES = ['vistas/capas/Derivador.tsx -> infraestructura'];

const errores = [];
for (const f of readdirSync(SRC, { recursive: true, withFileTypes: true })) {
  if (!f.isFile()) continue;
  const archivo = join(f.parentPath, f.name);
  const nombre = relative(SRC, archivo).split(sep).join('/');
  const capa = nombre.split('/')[0];
  if (!PERMITE[capa]) continue;
  for (const [, de] of readFileSync(archivo, 'utf8').matchAll(/(?:from|import|require\()\s*'([^']+)'/g)) {
    if (de.includes('/assets/')) continue;
    const usa = de.startsWith('.') ? relative(SRC, resolve(dirname(archivo), de)).split(sep)[0] : 'externo';
    if (!PERMITE[capa].includes(usa) && !EXCEPCIONES.includes(`${nombre} -> ${usa}`)) errores.push(`${nombre} no debe usar ${usa} (${de})`);
  }
}
if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
console.log('Capas en orden.');
