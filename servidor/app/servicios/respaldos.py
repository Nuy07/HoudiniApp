from app.dominio.entidades import Respaldo, Usuario
from app.dominio.errores import NoEncontrado
from app.dominio.puertos import RepositorioRespaldos


class ServicioRespaldos:
    """El respaldo llega ya cifrado desde el teléfono: aquí no se puede leer."""

    def __init__(self, respaldos: RepositorioRespaldos):
        self._respaldos = respaldos

    def leer(self, yo: Usuario) -> Respaldo:
        respaldo = self._respaldos.leer(yo.id)
        if not respaldo:
            raise NoEncontrado("Aún no tienes respaldo en la nube.")
        return respaldo

    def guardar(self, yo: Usuario, iv: str, datos: str) -> None:
        self._respaldos.guardar(yo.id, iv, datos)
