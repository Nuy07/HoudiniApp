import type { Coordenadas, Regla } from './modelos';

// Distancia en metros.
export function distancia(a: Coordenadas, b: Coordenadas) {
  const r = Math.PI / 180;
  const s = Math.sin(((b.lat - a.lat) * r) / 2) ** 2
    + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(s));
}

// Sabe a qué lugares se acaba de llegar.
export class DetectorLlegadas {
  private readonly dentro = new Map<number, boolean>(); // id de regla -> si ya estábamos dentro

  evaluar(reglas: Regla[], donde: Coordenadas) {
    return reglas.filter((r) => {
      const d = distancia(donde, r);
      const antes = this.dentro.get(r.id);
      // Se sale con 20% de margen para no rebotar en el borde.
      const ahora = antes ? d < r.radio * 1.2 : d <= r.radio;
      this.dentro.set(r.id, ahora);
      // Solo cuenta al ENTRAR: abrir la app estando dentro no activa nada.
      return antes === false && ahora;
    });
  }

  olvidar(id: number) { this.dentro.delete(id); }
  olvidarTodo() { this.dentro.clear(); }
}
