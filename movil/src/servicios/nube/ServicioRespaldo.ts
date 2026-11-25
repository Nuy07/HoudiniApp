// Respaldo cifrado de extremo a extremo.
import type { Cifrador, CopiaLocal, RespaldoRemoto, SesionActual } from '../../dominio/puertos';

export class ServicioRespaldo {
  constructor(
    private readonly remoto: RespaldoRemoto,
    private readonly copia: CopiaLocal,
    private readonly cifrador: Cifrador,
    private readonly sesion: SesionActual,
    private readonly alRestaurar: () => void,
  ) {}

  async respaldar() {
    const { clave } = this.sesion.exigir();
    await this.remoto.guardar(this.cifrador.cifrar(clave, this.copia.exportar()));
  }
  async restaurar() {
    const { clave } = this.sesion.exigir();
    const cifrado = await this.remoto.leer();
    let claro: string;
    try { claro = this.cifrador.descifrar(clave, cifrado); } catch { throw new Error('No se pudo descifrar el respaldo.'); }
    this.copia.importar(claro);
    this.alRestaurar();
  }
}
