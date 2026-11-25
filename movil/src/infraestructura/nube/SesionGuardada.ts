import type { Sesion } from '../../dominio/modelos';
import type { AlmacenSeguro, Notificable, SesionActual } from '../../dominio/puertos';
import { Emisor } from '../../dominio/Emisor';

export class SesionGuardada implements SesionActual {
  readonly cambio = new Emisor();
  private actual: Sesion | null = null;

  constructor(private readonly almacen: AlmacenSeguro, private readonly cambios: Notificable) {}

  get usuario() { return this.actual?.usuario ?? null; }
  get token() { return this.actual?.token ?? null; }

  cargar() {
    try { this.actual = JSON.parse(this.almacen.leer('sesion') ?? 'null'); } catch { this.actual = null; }
  }
  exigir() {
    if (!this.actual) throw new Error('Inicia sesión primero.');
    return this.actual;
  }
  abrir(s: Sesion) {
    this.actual = s;
    this.almacen.guardar('sesion', JSON.stringify(s));
    this.cambio.avisar();
  }
  async cerrar() {
    this.actual = null;
    this.cambio.avisar();
    await this.almacen.borrar('sesion');
    this.cambios.avisar();
  }
}
