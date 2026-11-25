import type { Conteo } from './modelos';

const DIAS: [string, string][] = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['0', 'Dom']];
const esFinde = (d: string) => d === '0' || d === '6';

// De los conteos por día de la semana a lo que muestra la gráfica.
export function resumenSemanal(porDia: Conteo[], total: number) {
  const cuenta = new Map(porDia.map((d) => [d.clave, d.total]));
  const maximo = Math.max(1, ...cuenta.values());
  const dias = DIAS.map(([clave, nombre]) => {
    const n = cuenta.get(clave) ?? 0;
    return { clave, nombre, total: n, proporcion: n / maximo, finde: esFinde(clave) };
  });
  const enFinde = dias.filter((d) => d.finde).reduce((s, d) => s + d.total, 0);
  return { dias, porcentajeFinde: total ? Math.round((enFinde / total) * 100) : 0 };
}
