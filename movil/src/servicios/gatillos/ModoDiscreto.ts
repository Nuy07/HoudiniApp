// Rescate discreto: la pantalla se ve apagada y 3 toques activan el escape.
import { Rafaga } from '../../dominio/rafaga';
import type { Notificable } from '../../dominio/puertos';

export class ModoDiscreto {
  private negro = false;
  private toques = this.nuevaRafaga();

  constructor(private readonly cambios: Notificable, private readonly alActivar: () => void) {}

  get activo() { return this.negro; }
  entrar() { this.toques = this.nuevaRafaga(); this.poner(true); }
  salir() { this.poner(false); }
  tocar() { this.toques.contar(); }

  private nuevaRafaga() { return new Rafaga(3, 1500, () => { this.salir(); this.alActivar(); }); }
  private poner(si: boolean) { this.negro = si; this.cambios.avisar(); }
}
