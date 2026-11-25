import type { PlanEscape } from '../../dominio/modelos';
import type { PlanesRemotos } from '../../dominio/puertos';
import type { ClienteApi } from './ClienteApi';

// Si tarda más, responde la IA del teléfono.
const LIMITE = 45000;

export class PlanesApi implements PlanesRemotos {
  constructor(private readonly api: ClienteApi) {}

  planear(situacion: string, evitar: string) { return this.api.crear<PlanEscape>('/ia/plan', { situacion, evitar }, LIMITE); }
}
