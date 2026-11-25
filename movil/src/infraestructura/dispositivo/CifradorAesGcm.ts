import { gcm } from '@noble/ciphers/aes.js';
import { hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { getRandomBytes } from 'expo-crypto';
import type { TextoCifrado } from '../../dominio/modelos';
import type { Cifrador } from '../../dominio/puertos';

export class CifradorAesGcm implements Cifrador {
  cifrar(clave: string, texto: string): TextoCifrado {
    const iv = getRandomBytes(12);
    const datos = gcm(hexToBytes(clave), iv).encrypt(utf8ToBytes(texto));
    return { iv: aB64(iv), datos: aB64(datos) };
  }
  descifrar(clave: string, { iv, datos }: TextoCifrado) {
    const claro = gcm(hexToBytes(clave), deB64(iv)).decrypt(deB64(datos));
    return new TextDecoder().decode(claro);
  }
}

function aB64(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
const deB64 = (t: string) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
