// Contrato de todo escape. Para agregar uno nuevo se crea su clase y se registra en el contenedor.
import type { Accion, Gatillo } from '../../dominio/modelos';

export interface Escape {
  readonly tipo: Accion;
  readonly prioridad: number; // el de mayor prioridad detiene a los demás
  readonly activo: boolean;
  iniciar(gatillo: Gatillo, id?: number): void;
  detener(): void;
}
