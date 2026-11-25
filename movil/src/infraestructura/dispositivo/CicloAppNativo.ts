import { AppState } from 'react-native';
import type { CicloApp } from '../../dominio/puertos';

export class CicloAppNativo implements CicloApp {
  activa() { return AppState.currentState === 'active'; }
  alActivar(fn: () => void) {
    AppState.addEventListener('change', (s) => { if (s === 'active') fn(); });
  }
  alVolver(fn: () => void) {
    let fuera = false;
    AppState.addEventListener('change', (s) => {
      if (s === 'background') fuera = true;
      if (s === 'active' && fuera) { fuera = false; fn(); }
    });
  }
}
