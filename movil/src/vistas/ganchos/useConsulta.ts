import { useEffect, useRef, useState } from 'react';

// Pide datos al servidor. Solo cuenta la respuesta de la última petición.
export function useConsulta<T>(consulta: () => Promise<T>, cuandoCambie: unknown[], espera = 0) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState('');
  const turno = useRef(0);
  const ultima = useRef(consulta);
  ultima.current = consulta;

  async function recargar() {
    const mio = ++turno.current;
    try {
      const nuevos = await ultima.current();
      if (mio === turno.current) { setDatos(nuevos); setError(''); }
    } catch (x) {
      if (mio === turno.current) setError((x as Error).message);
    }
  }
  useEffect(() => {
    const reloj = setTimeout(recargar, espera);
    return () => { clearTimeout(reloj); turno.current++; };
  }, cuandoCambie);

  return { datos, error, recargar };
}
