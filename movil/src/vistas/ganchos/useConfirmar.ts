import { Alert } from 'react-native';
import { useIntenta } from './useIntenta';

export function useConfirmar() {
  const intenta = useIntenta();
  return (pregunta: string, fn: () => unknown, accion = 'Eliminar') => Alert.alert('Confirmar', pregunta, [
    { text: 'Cancelar', style: 'cancel' },
    { text: accion, style: 'destructive', onPress: intenta(fn) },
  ]);
}
