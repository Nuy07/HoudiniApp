// De la contraseña salen DOS claves distintas: una para entrar y otra para cifrar.
// El servidor solo conoce la primera, por eso no puede leer tu respaldo.
import type { ModoAcceso } from '../../dominio/modelos';
import type { CuentasRemotas, DerivadorClaves, SesionActual } from '../../dominio/puertos';

export class ServicioCuenta {
  constructor(
    private readonly cuentas: CuentasRemotas,
    private readonly sesion: SesionActual,
    private readonly derivador: DerivadorClaves,
    private readonly alSalir: () => void,
  ) {}

  get usuario() { return this.sesion.usuario; }

  async entrar(modo: ModoAcceso, nombre: string, contrasena: string) {
    const usuario = nombre.trim().toLowerCase();
    if (contrasena.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    const hex = await this.derivador.derivar(contrasena.normalize('NFKC'), `houdini:${usuario}`);
    const acceso = await this.cuentas.acceder(modo, usuario, hex.slice(0, 64));
    this.sesion.abrir({ ...acceso, clave: hex.slice(64) });
  }
  async salir() {
    await this.cuentas.salir().catch(() => {});
    await this.sesion.cerrar();
    this.alSalir();
  }
  async borrar() {
    await this.cuentas.borrar();
    await this.sesion.cerrar();
    this.alSalir();
  }
}
