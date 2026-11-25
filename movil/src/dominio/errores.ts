// Error que respondió el servidor, con su código.
export class ErrorServidor extends Error {
  readonly estado: number;
  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}
