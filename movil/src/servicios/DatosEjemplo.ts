import type { RegistroEscapes } from '../dominio/puertos';

const DIA = 86400000;

export class DatosEjemplo {
  constructor(private readonly historial: RegistroEscapes) {}

  cargar() {
    for (let i = 0; i < 30; i++) {
      const fecha = new Date(Date.now() - Math.floor(Math.random() * 28) * DIA);
      this.historial.registrar(i % 3 ? 'llamada' : 'bomba', 'demo', 'Ejemplo', fecha);
    }
  }
}
