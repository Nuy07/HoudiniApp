import { Accelerometer } from 'expo-sensors';
import type { Aceleracion, Acelerometro } from '../../dominio/puertos';

export class AcelerometroExpo implements Acelerometro {
  disponible() { return Accelerometer.isAvailableAsync(); }
  async permiso() { return (await Accelerometer.requestPermissionsAsync()).granted; }
  oir(fn: (a: Aceleracion) => void) {
    Accelerometer.setUpdateInterval(100);
    const oyente = Accelerometer.addListener(fn);
    return () => oyente.remove();
  }
}
