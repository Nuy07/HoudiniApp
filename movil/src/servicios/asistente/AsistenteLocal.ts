// IA del teléfono: entiende la situación con el clasificador y aprende de los planes que usas.
import { ClasificadorBayes } from '../../dominio/ia/ClasificadorBayes';
import { EJEMPLOS, LEXICO, type Situacion } from '../../dominio/ia/ejemplos';
import { haySenalDePeligro, planPara } from '../../dominio/ia/planes';
import type { PlanEscape } from '../../dominio/modelos';
import type { Preferencias } from '../../dominio/puertos';

const MINIMA = 0.3;
const MAXIMO_APRENDIDO = 100;

export type Entendido = { situacion: Situacion | 'general'; confianza: number; plan: PlanEscape };

export class AsistenteLocal {
  private clasificador: ClasificadorBayes<Situacion> | null = null;

  constructor(private readonly preferencias: Preferencias) {}

  generar(texto: string, evitar = ''): Entendido {
    if (haySenalDePeligro(texto)) return { situacion: 'peligro', confianza: 1, plan: planPara('peligro') };
    const [mejor] = this.entrenado().clasificar(texto);
    const seguro = mejor && mejor.confianza >= MINIMA;
    const situacion = seguro ? mejor.clase : 'general';
    return { situacion, confianza: seguro ? mejor.confianza : 0, plan: planPara(situacion, evitar) };
  }

  // Usar un plan confirma que se entendió bien. Se queda solo en este teléfono.
  aprender(texto: string, situacion: Situacion | 'general') {
    if (situacion === 'general' || situacion === 'peligro') return;
    this.entrenado().aprender(texto, situacion);
    const guardados = [...this.aprendidos(), [texto.slice(0, 200), situacion]].slice(-MAXIMO_APRENDIDO);
    this.preferencias.guardar('ia_ejemplos', JSON.stringify(guardados));
  }

  get totalAprendido() { return this.aprendidos().length; }

  private entrenado() {
    if (this.clasificador) return this.clasificador;
    const c = new ClasificadorBayes<Situacion>();
    for (const [situacion, frases] of Object.entries(EJEMPLOS)) frases.forEach((f) => c.aprender(f, situacion as Situacion));
    for (const [situacion, lexico] of Object.entries(LEXICO)) c.aprender(lexico, situacion as Situacion);
    this.aprendidos().forEach(([texto, situacion]) => c.aprender(texto, situacion));
    this.clasificador = c;
    return c;
  }
  private aprendidos(): [string, Situacion][] {
    try { return JSON.parse(this.preferencias.leer('ia_ejemplos', '[]')); } catch { return []; }
  }
}
