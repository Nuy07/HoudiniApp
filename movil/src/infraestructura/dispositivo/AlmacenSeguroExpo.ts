import * as SecureStore from 'expo-secure-store';
import type { AlmacenSeguro } from '../../dominio/puertos';

export class AlmacenSeguroExpo implements AlmacenSeguro {
  leer(clave: string) { return SecureStore.getItem(clave); }
  guardar(clave: string, valor: string) { SecureStore.setItem(clave, valor); }
  borrar(clave: string) { return SecureStore.deleteItemAsync(clave); }
}
