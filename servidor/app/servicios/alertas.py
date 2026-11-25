import asyncio

from app.dominio.entidades import AlertaNueva, AlertaPendiente, ResultadoAlerta, Usuario
from app.dominio.errores import DatosInvalidos
from app.dominio.puertos import Mensajero, RepositorioAlertas

from .limitadores import Pausa


class ServicioAlertas:
    """Si el cómplice está desconectado, la alerta queda pendiente y se entrega al volver."""

    def __init__(self, alertas: RepositorioAlertas, mensajero: Mensajero, pausa: Pausa):
        self._alertas, self._mensajero, self._pausa = alertas, mensajero, pausa

    async def enviar(self, yo: Usuario, mensaje: str, lat: float | None, lng: float | None) -> ResultadoAlerta:
        mensaje = mensaje.strip()[:200]
        if not mensaje:
            raise DatosInvalidos("Escribe un mensaje.")
        if lat is None or lng is None:
            lat = lng = None
        self._pausa.tomar(yo.id)
        try:
            nuevas = await asyncio.to_thread(self._alertas.guardar, yo.id, AlertaNueva(mensaje, lat, lng))
            if not nuevas:
                raise DatosInvalidos("Aún no tienes cómplices aceptados.")
        except Exception:
            self._pausa.soltar(yo.id)  # si no se pudo guardar, se puede reintentar enseguida
            raise
        for n in nuevas:
            await self._mensajero.enviar(n.para, {"tipo": "alerta", "id": n.id, "de": yo.usuario, "mensaje": mensaje,
                                                  "lat": lat, "lng": lng, "creada": n.creada})
        return ResultadoAlerta(len(nuevas), sum(self._mensajero.conectado(n.para) for n in nuevas))

    async def pendientes(self, yo: Usuario) -> list[AlertaPendiente]:
        return await asyncio.to_thread(self._alertas.pendientes, yo.id)

    async def marcar_recibida(self, yo: Usuario, id_alerta) -> None:
        # El dato llega del teléfono sin revisar.
        if isinstance(id_alerta, int) and not isinstance(id_alerta, bool) and 0 < id_alerta < 2**63:
            await asyncio.to_thread(self._alertas.marcar_recibida, yo.id, id_alerta)
