import { Vibration } from 'react-native';
import type { Vibrador } from '../../dominio/puertos';

export class VibradorNativo implements Vibrador {
  vibrar(patron: number | number[], repetir = false) { Vibration.vibrate(patron, repetir); }
  parar() { Vibration.cancel(); }
}
