import { useContenedor } from '../contexto';

// Ejecuta algo, asíncrono o no, y muestra su error como aviso.
export function useIntenta() {
  const { avisos } = useContenedor();
  return (fn: () => unknown) => async () => {
    try { await fn(); } catch (e) { avisos.mostrar((e as Error)?.message || 'Algo salió mal.'); }
  };
}
