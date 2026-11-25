import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { Sonidos } from '../../dominio/puertos';

export class SonidosExpo implements Sonidos {
  private tono!: AudioPlayer;
  private aviso!: AudioPlayer;

  preparar() {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    this.tono = createAudioPlayer(require('../../../assets/tono.wav'));
    this.tono.loop = true;
    this.aviso = createAudioPlayer(require('../../../assets/mensaje.wav'));
  }
  iniciarTono() { reproducir(this.tono); }
  pararTono() { this.tono.pause(); }
  mensaje() { reproducir(this.aviso); }
}

function reproducir(p: AudioPlayer) {
  p.seekTo(0);
  p.play();
}
