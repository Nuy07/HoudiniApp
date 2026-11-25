// Aviso breve en la parte de abajo.
import type { Avisador, Notificable } from '../dominio/puertos';

const VISIBLE = 3500;

export class Avisos implements Avisador {
  private actual = '';
  private reloj?: ReturnType<typeof setTimeout>;

  constructor(private readonly cambios: Notificable) {}

  get texto() { return this.actual; }
  mostrar(texto: string) {
    this.actual = texto;
    clearTimeout(this.reloj);
    this.reloj = setTimeout(() => { this.actual = ''; this.cambios.avisar(); }, VISIBLE);
    this.cambios.avisar();
  }
}
