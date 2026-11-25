import type { Notificable } from '../dominio/puertos';

export type Ruta = 'inicio' | 'perfiles' | 'reglas' | 'historial' | 'tienda' | 'complices' | 'ajustes';

export class Navegacion {
  private actual: Ruta = 'inicio';

  constructor(private readonly cambios: Notificable) {}

  get ruta() { return this.actual; }
  ir(r: Ruta) { this.actual = r; this.cambios.avisar(); }
}
