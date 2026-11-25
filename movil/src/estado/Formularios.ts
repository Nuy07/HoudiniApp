// Formulario emergente que está abierto.
import type { Notificable } from '../dominio/puertos';

export type Valores = Record<string, string>;
export type Campo = {
  id: string;
  label: string;
  tipo?: 'texto' | 'area' | 'numero' | 'clave' | 'opciones' | 'si';
  valor?: string | number;
  ayuda?: string;
  max?: number;
  opciones?: [string, string][];
  extra?: { texto: string; accion: () => Promise<Valores> }; // botón que rellena campos
};
export type DatosFormulario = { titulo: string; campos: Campo[]; guardar: (v: Valores) => void | Promise<void> };

export class Formularios {
  private abierto: DatosFormulario | null = null;

  constructor(private readonly cambios: Notificable) {}

  get actual() { return this.abierto; }
  abrir(titulo: string, campos: Campo[], guardar: DatosFormulario['guardar']) {
    this.abierto = { titulo, campos, guardar };
    this.cambios.avisar();
  }
  cerrar(este?: DatosFormulario) {
    // Si al guardar se abrió otro formulario, ese se queda.
    if (este && this.abierto !== este) return;
    this.abierto = null;
    this.cambios.avisar();
  }

  // Revisa lo escrito y lo deja listo para guardar.
  static limpiar(campos: Campo[], valores: Valores): Valores {
    const limpios: Valores = {};
    for (const c of campos) {
      const v = c.tipo === 'clave' ? valores[c.id] : valores[c.id].trim();
      if (!v && c.tipo !== 'si') throw new Error(`Falta: ${c.label}.`);
      // Se admite coma decimal, que es lo que trae el teclado en español.
      const n = v.replace(',', '.');
      if (c.tipo === 'numero' && !Number.isFinite(Number(n))) throw new Error(`Escribe un número en: ${c.label}.`);
      limpios[c.id] = c.tipo === 'numero' ? n : v;
    }
    return limpios;
  }
}
