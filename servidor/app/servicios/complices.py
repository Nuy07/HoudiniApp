import asyncio

from app.dominio.entidades import Usuario, Vinculo
from app.dominio.errores import DatosInvalidos, NoEncontrado
from app.dominio.puertos import Mensajero, RepositorioComplices


class ServicioComplices:
    """Las consultas corren en otro hilo para no frenar los WebSocket."""

    def __init__(self, complices: RepositorioComplices, mensajero: Mensajero):
        self._complices, self._mensajero = complices, mensajero

    async def listar(self, yo: Usuario) -> list[tuple[Vinculo, bool]]:
        """Cada vínculo con su estado en línea, que solo se comparte si ambos aceptaron."""
        vinculos = await asyncio.to_thread(self._complices.listar, yo.id)
        return [(v, v.aceptado and self._mensajero.conectado(v.usuario)) for v in vinculos]

    async def pedir(self, yo: Usuario, otro: str) -> None:
        otro = otro.strip().lower()
        if otro == yo.usuario:
            raise DatosInvalidos("No puedes agregarte a ti.")
        await asyncio.to_thread(self._complices.pedir, yo.id, otro)
        await self._mensajero.enviar(otro, {"tipo": "solicitud", "de": yo.usuario})

    async def aceptar(self, yo: Usuario, otro: str) -> None:
        if not await asyncio.to_thread(self._complices.aceptar, yo.id, otro):
            raise NoEncontrado("No hay solicitud.")
        await self._mensajero.enviar(otro, {"tipo": "aceptado", "de": yo.usuario})

    async def quitar(self, yo: Usuario, otro: str) -> None:
        await asyncio.to_thread(self._complices.quitar, yo.id, otro)
