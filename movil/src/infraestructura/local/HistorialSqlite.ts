// Patrones de uso con COUNT y GROUP BY.
import { fechaLocal } from '../../dominio/fechas';
import type { Conteo, Gatillo, Registro } from '../../dominio/modelos';
import type { ConsultaHistorial, RegistroEscapes } from '../../dominio/puertos';
import type { BaseLocal } from './BaseLocal';

export class HistorialSqlite implements RegistroEscapes, ConsultaHistorial {
  constructor(private readonly bd: BaseLocal) {}

  registrar(tipo: string, gatillo: Gatillo, detalle: string, fecha = new Date()) {
    this.bd.ejecutar('INSERT INTO historial (tipo, gatillo, detalle, fecha) VALUES (?, ?, ?, ?)', [tipo, gatillo, detalle, fechaLocal(fecha)]);
  }

  total() { return this.bd.contar('historial'); }
  deEjemplo() { return this.bd.contar("historial WHERE gatillo = 'demo'"); }
  porDia() { return this.contarPor("strftime('%w', fecha)"); }
  porTipo() { return this.contarPor('tipo'); }
  porGatillo() { return this.contarPor('gatillo'); }
  recientes() { return this.bd.todos<Registro>('SELECT * FROM historial ORDER BY fecha DESC, id DESC LIMIT 10'); }

  quitarEjemplos() { this.bd.ejecutar("DELETE FROM historial WHERE gatillo = 'demo'"); }
  borrar() { this.bd.ejecutar('DELETE FROM historial'); }

  private contarPor(expresion: string) {
    return this.bd.todos<Conteo>(`SELECT ${expresion} AS clave, COUNT(*) AS total FROM historial GROUP BY 1 ORDER BY total DESC`);
  }
}
