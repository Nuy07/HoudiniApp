import type { PaqueteDescargado, Perfil, PerfilPublico, Voz, VozPublica } from '../../dominio/modelos';
import type { ColeccionPerfiles, ColeccionVoces, TiendaRemota } from '../../dominio/puertos';

export class ServicioTienda {
  constructor(
    private readonly remota: TiendaRemota,
    private readonly voces: ColeccionVoces,
    private readonly perfiles: ColeccionPerfiles,
  ) {}

  buscar(tipo: string, texto: string) { return this.remota.buscar(tipo, texto.trim()); }
  retirar(id: number) { return this.remota.retirar(id); }
  publicarVoz(voz: Voz, nombre: string, descripcion: string) {
    return this.remota.publicar({ tipo: 'voz', nombre, descripcion, contenido: sinId(voz) });
  }
  publicarPerfil(perfil: Perfil, voz: Voz, nombre: string, descripcion: string) {
    const contenido = { nombre: perfil.nombre, etiqueta: perfil.etiqueta, voz: sinId(voz) };
    return this.remota.publicar({ tipo: 'perfil', nombre, descripcion, contenido });
  }

  // Guarda el paquete en el teléfono: ya funciona sin internet.
  async descargar(id: number) {
    const { nombre, etiqueta, voz } = aPerfil(await this.remota.descargar(id));
    this.perfiles.agregar({ nombre, etiqueta, vozId: this.voces.agregar(voz) });
  }
}

const sinId = ({ nombre, rate, pitch, guion }: Voz): VozPublica => ({ nombre, rate, pitch, guion });
const aPerfil = (d: PaqueteDescargado): PerfilPublico =>
  d.tipo === 'voz' ? { nombre: d.nombre, etiqueta: 'Móvil', voz: { ...d.contenido, nombre: d.nombre } } : d.contenido;
