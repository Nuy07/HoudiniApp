"""WebSocket: entrega solicitudes y alertas al instante."""
import asyncio
import json
from dataclasses import asdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.dependencias import Alertas, Conexiones, Sesiones
from app.dominio.entidades import Usuario
from app.dominio.errores import BaseNoDisponible
from app.infraestructura.conexiones import SESION_NO_VALIDA
from app.servicios.sesiones import ServicioSesiones

router = APIRouter()
INTENTAR_DESPUES = 1013
ESPERA_TOKEN = 5


def _leer(texto: str) -> dict:
    try:
        m = json.loads(texto)
    except ValueError:
        return {}
    return m if isinstance(m, dict) else {}


async def _autenticar(ws: WebSocket, sesiones: ServicioSesiones) -> Usuario | None:
    """El primer mensaje debe traer el token, y hay 5 segundos para mandarlo."""
    try:
        m = _leer(await asyncio.wait_for(ws.receive_text(), ESPERA_TOKEN))
        if m.get("tipo") != "auth":
            return None
        return await asyncio.to_thread(sesiones.usuario_de, m.get("token"))
    except (asyncio.TimeoutError, UnicodeEncodeError):
        return None


@router.websocket("/tiempo-real")
async def tiempo_real(ws: WebSocket, sesiones: Sesiones, alertas: Alertas, conexiones: Conexiones):
    await ws.accept()
    yo = None
    try:
        yo = await _autenticar(ws, sesiones)
        if not yo:
            await ws.close(SESION_NO_VALIDA)
            return
        conexiones.agregar(yo.usuario, ws)
        await ws.send_json({"tipo": "listo"})
        for p in await alertas.pendientes(yo):
            await ws.send_json({"tipo": "alerta", **asdict(p)})
        while True:
            m = _leer(await ws.receive_text())
            if m.get("tipo") == "recibida":
                await alertas.marcar_recibida(yo, m.get("id"))
    except BaseNoDisponible:
        # La app reconecta sola y vuelve a recibir lo pendiente.
        try:
            await ws.close(INTENTAR_DESPUES)
        except RuntimeError:
            pass
    except (WebSocketDisconnect, RuntimeError, KeyError):
        pass  # KeyError: llegó un mensaje binario
    finally:
        if yo:
            conexiones.quitar(yo.usuario, ws)
