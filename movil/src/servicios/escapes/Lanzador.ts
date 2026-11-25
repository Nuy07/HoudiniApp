// Decide qué escape se inicia. No conoce a ninguno en particular.
import type { Accion, Gatillo } from '../../dominio/modelos';
import type { Preferencias } from '../../dominio/puertos';
import type { Escape, QueLanzar } from './Escape';

export class Lanzador {
  constructor(
    private readonly escapes: Escape[],
    private readonly preferencias: Preferencias,
    private readonly antesDeIniciar: () => void = () => {},
  ) {}

  lanzar(tipo: Accion, gatillo: Gatillo, que?: QueLanzar) {
    const elegido = this.escapes.find((e) => e.tipo === tipo) ?? this.escapes[0];
    const activos = this.escapes.filter((e) => e.activo);
    if (activos.some((e) => e.prioridad >= elegido.prioridad)) return;
    activos.forEach((e) => e.detener());
    this.antesDeIniciar();
    elegido.iniciar(gatillo, que);
  }
  lanzarPreferido(gatillo: Gatillo) { this.lanzar(this.preferencias.leer('accion', 'llamada') as Accion, gatillo); }
}
