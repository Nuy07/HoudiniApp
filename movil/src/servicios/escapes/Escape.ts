// Contrato de todo escape. Para agregar uno nuevo se crea su clase y se registra en el contenedor.
import type { Accion, Gatillo, PlanEscape } from '../../dominio/modelos';

// Qué lanzar: el id de algo guardado o un plan de la IA. Sin nada, el predeterminado.
export type QueLanzar = number | PlanEscape;

export interface Escape {
  readonly tipo: Accion;
  readonly prioridad: number; // el de mayor prioridad detiene a los demás
  readonly activo: boolean;
  iniciar(gatillo: Gatillo, que?: QueLanzar): void;
  detener(): void;
}
