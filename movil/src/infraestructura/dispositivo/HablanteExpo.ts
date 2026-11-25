import * as Speech from 'expo-speech';
import type { Hablante } from '../../dominio/puertos';

export class HablanteExpo implements Hablante {
  decir(texto: string, tono: { rate: number; pitch: number }, alTerminar: () => void) {
    Speech.speak(texto, { language: 'es-MX', ...tono, onDone: alTerminar, onError: alTerminar });
  }
  callar() { Speech.stop(); }
}
