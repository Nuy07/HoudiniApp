// Única puerta de salida hacia la API de Python.
import { ErrorServidor } from '../../dominio/errores';
import type { SesionActual } from '../../dominio/puertos';
import type { DireccionServidor } from './DireccionServidor';

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';
// Render gratis se duerme sin uso: la primera petición puede tardar cerca de un minuto.
const LIMITE = 75000;

export class ClienteApi {
  constructor(private readonly direccion: DireccionServidor, private readonly sesion: SesionActual) {}

  obtener<T>(ruta: string) { return this.pedir<T>('GET', ruta); }
  crear<T = unknown>(ruta: string, datos?: unknown, limite?: number) { return this.pedir<T>('POST', ruta, datos, limite); }
  guardar<T = unknown>(ruta: string, datos: unknown) { return this.pedir<T>('PUT', ruta, datos); }
  borrar(ruta: string) { return this.pedir<void>('DELETE', ruta); }
  // Falla si el servidor no responde.
  async probar() { await this.obtener('/estado'); }

  private async pedir<T>(method: Metodo, ruta: string, datos?: unknown, limite = LIMITE): Promise<T> {
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), limite);
    const token = this.sesion.token;
    let r: Response;
    let texto: string;
    try {
      r = await fetch(`${this.direccion.url}/api${ruta}`, {
        method,
        signal: corte.signal,
        headers: {
          ...(datos !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: datos === undefined ? undefined : JSON.stringify(datos),
      });
      texto = await r.text();
    } catch {
      throw new Error('Sin conexión con el servidor. Las funciones locales siguen activas.');
    } finally { clearTimeout(reloj); }

    let j: any = null;
    try { j = texto ? JSON.parse(texto) : null; } catch { /* respuesta que no es JSON */ }
    if (r.status === 401 && token && token === this.sesion.token) await this.sesion.cerrar();
    if (!r.ok) throw new ErrorServidor(j?.error ?? 'Error del servidor.', r.status);
    return j as T;
  }
}
