from collections.abc import Mapping

from app.dominio.contenido import ValidadorContenido
from app.dominio.entidades import Catalogo, PaqueteDescargado, PaqueteNuevo, Usuario
from app.dominio.errores import DatosInvalidos, NoEncontrado
from app.dominio.puertos import RepositorioTienda
from app.dominio.texto import limpio

MAX_ID = 2**63


class ServicioTienda:
    def __init__(self, tienda: RepositorioTienda, validadores: Mapping[str, ValidadorContenido]):
        self._tienda, self._validadores = tienda, validadores

    def buscar(self, tipo: str, texto: str) -> Catalogo:
        tipo = tipo if tipo in self._validadores else ""
        return Catalogo(self._tienda.buscar(tipo, texto[:60]), self._tienda.totales())

    def publicar(self, yo: Usuario, paquete: PaqueteNuevo) -> int:
        nombre, descripcion = limpio(paquete.nombre, 60), limpio(paquete.descripcion, 160)
        validador = self._validadores.get(paquete.tipo)
        contenido = validador.limpiar(paquete.contenido) if validador else None
        if not (nombre and descripcion and contenido):
            raise DatosInvalidos("Paquete incompleto.")
        return self._tienda.publicar(yo.id, PaqueteNuevo(paquete.tipo, nombre, descripcion, contenido))

    def descargar(self, id_paquete: int) -> PaqueteDescargado:
        paquete = self._tienda.descargar(id_paquete) if 0 < id_paquete < MAX_ID else None
        if not paquete:
            raise NoEncontrado("Paquete no encontrado.")
        return paquete

    def retirar(self, yo: Usuario, id_paquete: int) -> None:
        if not (0 < id_paquete < MAX_ID and self._tienda.retirar(yo.id, id_paquete)):
            raise NoEncontrado("No es un paquete tuyo.")
