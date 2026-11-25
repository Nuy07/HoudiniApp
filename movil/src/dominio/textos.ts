// Convierte y revisa lo que se escribe en los formularios.
import type { Mensaje } from './modelos';

// Texto de varias líneas a lista, sin vacías y con máximo 20.
const lineas = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20);

export function leerGuion(texto: string) {
  const guion = lineas(texto).map((l) => l.slice(0, 200));
  if (!guion.length) throw new Error('Escribe al menos una frase.');
  return guion;
}

export function leerMensajes(texto: string): Mensaje[] {
  const mensajes = lineas(texto).map((l) => {
    const i = l.indexOf(':');
    if (i < 1 || !l.slice(i + 1).trim()) throw new Error(`Usa el formato "Nombre: mensaje" en: ${l}`);
    return { de: l.slice(0, i).trim(), texto: l.slice(i + 1).trim() };
  });
  if (!mensajes.length) throw new Error('Escribe al menos un mensaje.');
  return mensajes;
}
export const escribirMensajes = (m: Mensaje[]) => m.map((x) => `${x.de}: ${x.texto}`).join('\n');

// Velocidad y tono de la voz.
export const limitarTono = (n: number) => Math.min(2, Math.max(0.5, n));

export function leerZona(lat: number, lng: number, radio: number) {
  const metros = Math.round(radio);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Coordenadas no válidas.');
  if (metros < 30) throw new Error('El radio mínimo es de 30 metros.');
  return { lat, lng, radio: metros };
}

export const inicialDe = (nombre: string) => [...nombre.trim()][0]?.toUpperCase() ?? '?';

const dos = (n: number) => String(n).padStart(2, '0');
export const duracion = (segundos: number) => `${dos(Math.floor(segundos / 60))}:${dos(segundos % 60)}`;
export const tiempoCorto = (segundos: number) => (segundos < 60 ? `${segundos} s` : `${segundos / 60} min`);
