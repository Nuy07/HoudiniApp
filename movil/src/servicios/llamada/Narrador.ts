// Va diciendo el guion, con una pausa entre frases para que puedas "responder".
import type { DatosLlamada } from '../../dominio/modelos';
import type { Detener, Hablante } from '../../dominio/puertos';

const ANTES = 700;
const ENTRE_FRASES = 2500;

export class Narrador {
  constructor(private readonly hablante: Hablante) {}

  narrar(p: DatosLlamada): Detener {
    let vivo = true;
    let espera: ReturnType<typeof setTimeout>;
    const decir = (i: number) => {
      if (!vivo || i >= p.guion.length) return;
      const seguir = () => { if (vivo) espera = setTimeout(() => decir(i + 1), ENTRE_FRASES); };
      this.hablante.decir(p.guion[i], { rate: p.rate, pitch: p.pitch }, seguir);
    };
    espera = setTimeout(() => decir(0), ANTES);
    return () => { vivo = false; clearTimeout(espera); this.hablante.callar(); };
  }
}
