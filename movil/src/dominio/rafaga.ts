// "n" eventos en menos de "ms" milisegundos.
export class Rafaga {
  private tiempos: number[] = [];

  constructor(private readonly n: number, private readonly ms: number, private readonly alCompletar: () => void) {}

  contar(ahora = Date.now()) {
    this.tiempos = [...this.tiempos.filter((x) => ahora - x < this.ms), ahora];
    if (this.tiempos.length < this.n) return;
    this.tiempos = [];
    this.alCompletar();
  }
}
