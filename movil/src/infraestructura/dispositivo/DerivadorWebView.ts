// Convierte la contraseña en claves con el WebCrypto nativo del sistema (PBKDF2, 600 000 vueltas).
// En JavaScript puro tardaría cerca de un minuto, por eso lo calcula un WebView oculto (vistas/capas/Derivador).
import type { DerivadorClaves, Notificable } from '../../dominio/puertos';

export type Pedido = { id: number; contrasena: string; sal: string; listo: (hex: string) => void; mal: (texto: string) => void };
const LIMITE = 45000;

export class DerivadorWebView implements DerivadorClaves {
  private pedido: Pedido | null = null;
  private serie = 0;

  constructor(private readonly cambios: Notificable) {}

  get pendiente() { return this.pedido; }
  vigente(p: Pedido) { return this.pedido === p; }

  derivar(contrasena: string, sal: string) {
    if (this.pedido) return Promise.reject(new Error('Espera a que termine el intento anterior.'));
    return new Promise<string>((resolver, rechazar) => {
      const limite = setTimeout(() => mal('El teléfono tardó demasiado. Intenta de nuevo.'), LIMITE);
      const fin = () => { clearTimeout(limite); this.pedido = null; this.cambios.avisar(); };
      const mal = (texto: string) => { fin(); rechazar(new Error(texto)); };
      this.pedido = { id: ++this.serie, contrasena, sal, mal, listo: (hex) => { fin(); resolver(hex); } };
      this.cambios.avisar();
    });
  }
}
