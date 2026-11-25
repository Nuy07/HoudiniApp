// IA DEL TELÉFONO: clasificador de texto Naive Bayes multinomial con suavizado de Laplace.
// Aprende contando palabras por clase, así que entrena en milisegundos y sin internet.

const VACIAS = new Set(('que con los las una uno del por para muy mas pero como esta este esto estoy hay son sus mis '
  + 'ella ellos desde hasta sin sobre porque cuando donde quien algo aqui ahi tengo quiero puedo voy ser era fue han '
  + 'necesito ayuda ayudame salir irme escapar').split(' '));

// Minúsculas, sin acentos y solo la raíz de cada palabra: "reunión" y "reuniones" cuentan igual.
export function palabras(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/)
    .filter((p) => p.length > 2 && !VACIAS.has(p)).map((p) => p.slice(0, 5));
}

const SUAVE = 0.3; // probabilidad mínima para palabras nunca vistas en una clase

export type Prediccion<C extends string> = { clase: C; confianza: number };

export class ClasificadorBayes<C extends string> {
  private readonly conteos = new Map<C, Map<string, number>>();
  private readonly totales = new Map<C, number>();
  private readonly vocabulario = new Set<string>();

  aprender(texto: string, clase: C) {
    const conteo = this.conteos.get(clase) ?? new Map<string, number>();
    this.conteos.set(clase, conteo);
    for (const p of palabras(texto)) {
      conteo.set(p, (conteo.get(p) ?? 0) + 1);
      this.totales.set(clase, (this.totales.get(clase) ?? 0) + 1);
      this.vocabulario.add(p);
    }
  }

  // De mayor a menor confianza. Vacío si no reconoce ninguna palabra.
  clasificar(texto: string): Prediccion<C>[] {
    const conocidas = palabras(texto).filter((p) => this.vocabulario.has(p));
    if (!conocidas.length) return [];
    // Todas las situaciones arrancan igual de probables: así lo aprendido no aplasta a las demás.
    const puntos = [...this.conteos].map(([clase, conteo]) => {
      const base = (this.totales.get(clase) ?? 0) + SUAVE * this.vocabulario.size;
      // Se suman logaritmos: multiplicar probabilidades tan chicas daría cero.
      const p = conocidas.reduce((s, x) => s + Math.log(((conteo.get(x) ?? 0) + SUAVE) / base), 0);
      return { clase, p };
    });
    const maximo = Math.max(...puntos.map((x) => x.p));
    const suma = puntos.reduce((s, x) => s + Math.exp(x.p - maximo), 0);
    return puntos.map((x) => ({ clase: x.clase, confianza: Math.exp(x.p - maximo) / suma })).sort((a, b) => b.confianza - a.confianza);
  }
}
