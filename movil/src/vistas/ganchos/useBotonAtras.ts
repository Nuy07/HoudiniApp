import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

// Devuelve true si la vista ya atendió el botón "atrás" de Android.
export function useBotonAtras(fn: () => boolean) {
  const ultima = useRef(fn);
  ultima.current = fn;
  useEffect(() => {
    const atras = BackHandler.addEventListener('hardwareBackPress', () => ultima.current());
    return () => atras.remove();
  }, []);
}
