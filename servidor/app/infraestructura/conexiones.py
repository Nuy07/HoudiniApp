"""Quién está conectado ahora por WebSocket."""
from fastapi import WebSocket, WebSocketDisconnect

SESION_NO_VALIDA = 4001


class ConexionesWebSocket:
    def __init__(self):
        self._abiertas: dict[str, set[WebSocket]] = {}

    def agregar(self, usuario: str, ws: WebSocket) -> None:
        self._abiertas.setdefault(usuario, set()).add(ws)

    def quitar(self, usuario: str, ws: WebSocket) -> None:
        grupo = self._abiertas.get(usuario, set())
        grupo.discard(ws)
        if not grupo:
            self._abiertas.pop(usuario, None)

    def conectado(self, usuario: str) -> bool:
        return bool(self._abiertas.get(usuario))

    async def enviar(self, usuario: str, mensaje: dict) -> None:
        for ws in list(self._abiertas.get(usuario, ())):
            try:
                await ws.send_json(mensaje)
            except (RuntimeError, WebSocketDisconnect):
                pass  # se cerró justo ahora: la alerta queda pendiente en la base

    async def desconectar(self, usuario: str) -> None:
        for ws in list(self._abiertas.get(usuario, ())):
            try:
                await ws.close(SESION_NO_VALIDA)
            except RuntimeError:
                pass
