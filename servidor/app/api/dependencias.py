"""Entrega a cada ruta el servicio que pide, ya armado por el contenedor."""
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, Request
from fastapi.requests import HTTPConnection

from app.dominio.entidades import Usuario
from app.dominio.errores import NoAutorizado
from app.infraestructura.conexiones import ConexionesWebSocket
from app.servicios.alertas import ServicioAlertas
from app.servicios.complices import ServicioComplices
from app.servicios.cuentas import ServicioCuentas
from app.servicios.respaldos import ServicioRespaldos
from app.servicios.sesiones import ServicioSesiones
from app.servicios.tienda import ServicioTienda


def _del_contenedor(nombre: str):
    async def obtener(conexion: HTTPConnection):
        return getattr(conexion.app.state.contenedor, nombre)
    return Depends(obtener)


Cuentas = Annotated[ServicioCuentas, _del_contenedor("cuentas")]
Sesiones = Annotated[ServicioSesiones, _del_contenedor("sesiones")]
Respaldos = Annotated[ServicioRespaldos, _del_contenedor("respaldos")]
Tienda = Annotated[ServicioTienda, _del_contenedor("tienda")]
Complices = Annotated[ServicioComplices, _del_contenedor("complices")]
Alertas = Annotated[ServicioAlertas, _del_contenedor("alertas")]
Conexiones = Annotated[ConexionesWebSocket, _del_contenedor("conexiones")]


@dataclass(frozen=True)
class UsuarioActual(Usuario):
    token: str


def usuario_actual(sesiones: Sesiones, authorization: Annotated[str, Header()] = "") -> UsuarioActual:
    """Exige "Authorization: Bearer <token>"."""
    token = authorization.removeprefix("Bearer ")
    usuario = sesiones.usuario_de(token)
    if not usuario:
        raise NoAutorizado("Inicia sesión primero.")
    return UsuarioActual(usuario.id, usuario.usuario, token)


Yo = Annotated[UsuarioActual, Depends(usuario_actual)]


def limitar_direccion(request: Request) -> None:
    """Freno a quien prueba contraseñas desde una misma dirección."""
    contenedor = request.app.state.contenedor
    ip = request.client.host if request.client else "?"
    if contenedor.configuracion.tras_proxy:
        ip = request.headers.get("cf-connecting-ip", ip)
    contenedor.limite_direccion.contar(ip)
