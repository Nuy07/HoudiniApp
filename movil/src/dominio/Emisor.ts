// Cuando algo cambia se llama a avisar() y las pantallas se repintan.
import type { Notificable } from './puertos';

export class Emisor implements Notificable {
  private version = 0;
  private readonly oyentes = new Set<() => void>();

  readonly leerVersion = () => this.version;
  readonly avisar = () => {
    this.version++;
    this.oyentes.forEach((f) => f());
  };
  readonly suscribir = (f: () => void) => {
    this.oyentes.add(f);
    return () => { this.oyentes.delete(f); };
  };
}
