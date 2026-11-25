// La API en Render. Se puede cambiar en Configuración, por ejemplo para probar en tu computadora.
import type { Preferencias } from '../../dominio/puertos';
import { Emisor } from '../../dominio/Emisor';

const RENDER = 'https://houdiniapp-api.onrender.com';

export class DireccionServidor {
  readonly cambio = new Emisor();

  constructor(private readonly preferencias: Preferencias) {}

  get url() { return this.preferencias.leer('servidor') || RENDER; }
  get urlTiempoReal() { return `${this.url.replace(/^http/, 'ws')}/tiempo-real`; }
  get personalizada() { return this.preferencias.leer('servidor') !== ''; }

  cambiar(url: string) {
    const limpia = url.trim().replace(/\/+$/, '');
    if (limpia && !/^https?:\/\/[^\s/]+$/.test(limpia)) throw new Error('Usa el formato https://mi-api.onrender.com');
    this.preferencias.guardar('servidor', limpia === RENDER ? '' : limpia);
    this.cambio.avisar();
  }
}
