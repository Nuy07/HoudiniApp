import type { ClavePreferencia, Preferencias } from '../../dominio/puertos';
import type { BaseLocal } from './BaseLocal';

export class PreferenciasSqlite implements Preferencias {
  constructor(private readonly bd: BaseLocal) {}

  leer(clave: ClavePreferencia, defecto = '') {
    return this.bd.uno<{ valor: string }>('SELECT valor FROM config WHERE clave = ?', [clave])?.valor ?? defecto;
  }
  guardar(clave: ClavePreferencia, valor: string | number) {
    this.bd.ejecutar('INSERT INTO config VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', [clave, String(valor)]);
  }
}
