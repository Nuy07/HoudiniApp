import * as Location from 'expo-location';
import type { Coordenadas } from '../../dominio/modelos';
import type { Ubicacion } from '../../dominio/puertos';

// Sin el diálogo de "Precisión de ubicación" de Google: basta con el GPS del teléfono.
const OPCIONES = { accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false };
const LIMITE = 15000;

export class UbicacionExpo implements Ubicacion {
  async permiso() { return (await Location.requestForegroundPermissionsAsync()).granted; }

  async vigilar(fn: (c: Coordenadas) => void) {
    await this.exigirEncendida();
    const vigia = await Location.watchPositionAsync({ ...OPCIONES, distanceInterval: 10, timeInterval: 5000 }, (p) => fn(aCoordenadas(p)));
    return () => vigia.remove();
  }
  async actual() {
    if (!(await this.permiso())) throw new Error('No se dio permiso de ubicación.');
    await this.exigirEncendida();
    const corte = new Promise<never>((_, mal) => { setTimeout(() => mal(new Error('No se pudo obtener tu ubicación.')), LIMITE); });
    return aCoordenadas(await Promise.race([Location.getCurrentPositionAsync(OPCIONES), corte]));
  }

  private async exigirEncendida() {
    if (!(await Location.hasServicesEnabledAsync())) throw new Error('Enciende la ubicación del teléfono.');
  }
}

const aCoordenadas = ({ coords }: Location.LocationObject) => ({ lat: coords.latitude, lng: coords.longitude });
