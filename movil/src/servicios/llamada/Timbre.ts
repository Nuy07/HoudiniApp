import type { Sonidos, Vibrador } from '../../dominio/puertos';

export class Timbre {
  constructor(private readonly sonidos: Sonidos, private readonly vibrador: Vibrador) {}

  sonar() {
    this.sonidos.iniciarTono();
    this.vibrador.vibrar([0, 600, 300, 600, 700], true);
  }
  parar() {
    this.sonidos.pararTono();
    this.vibrador.parar();
  }
}
