"""Contratos que necesitan los servicios. La infraestructura los cumple (inversión de dependencias),
así se puede cambiar Supabase o probar en memoria sin tocar los servicios."""
from typing import Protocol

from .entidades import (AlertaGuardada, AlertaNueva, AlertaPendiente, Credencial, PaqueteDescargado, PaqueteNuevo,
                        PaqueteResumen, Respaldo, SesionNueva, TotalPorTipo, Usuario, Vinculo)


# ---------- Datos ----------
class RepositorioUsuarios(Protocol):
    def registrar(self, usuario: str, sal: str, huella: str, sesion: SesionNueva) -> None:
        """Crea la cuenta y su primera sesión, o nada. Lanza Conflicto si el nombre ya existe."""

    def credencial(self, usuario: str) -> Credencial | None: ...

    def eliminar(self, id_usuario: int) -> None: ...


class RepositorioSesiones(Protocol):
    def abrir(self, id_usuario: int, sesion: SesionNueva) -> None: ...

    def usuario(self, huella: str) -> Usuario | None: ...

    def cerrar(self, huella: str) -> None: ...


class RepositorioRespaldos(Protocol):
    def leer(self, id_usuario: int) -> Respaldo | None: ...

    def guardar(self, id_usuario: int, iv: str, datos: str) -> None: ...


class RepositorioTienda(Protocol):
    def buscar(self, tipo: str, texto: str) -> list[PaqueteResumen]: ...

    def totales(self) -> list[TotalPorTipo]: ...

    def publicar(self, id_autor: int, paquete: PaqueteNuevo) -> int: ...

    def descargar(self, id_paquete: int) -> PaqueteDescargado | None: ...

    def retirar(self, id_autor: int, id_paquete: int) -> bool: ...


class RepositorioComplices(Protocol):
    def listar(self, yo: int) -> list[Vinculo]: ...

    def pedir(self, yo: int, otro: str) -> None:
        """Lanza NoEncontrado si no existe y Conflicto si ya hay vínculo."""

    def aceptar(self, yo: int, otro: str) -> bool: ...

    def quitar(self, yo: int, otro: str) -> None: ...


class RepositorioAlertas(Protocol):
    def guardar(self, yo: int, alerta: AlertaNueva) -> list[AlertaGuardada]:
        """Crea una alerta por cada cómplice aceptado."""

    def pendientes(self, yo: int) -> list[AlertaPendiente]: ...

    def marcar_recibida(self, yo: int, id_alerta: int) -> None: ...


# ---------- Otros ----------
class Huellas(Protocol):
    def crear(self, clave: str) -> tuple[str, str]:
        """Devuelve (sal, huella)."""

    def coincide(self, clave: str, credencial: Credencial | None) -> bool: ...


class GeneradorPlanes(Protocol):
    """Cualquier IA que sepa armar un plan de escape."""

    def generar(self, situacion: str, evitar: str) -> dict: ...


class Mensajero(Protocol):
    """Avisos al instante a quien esté conectado."""

    def conectado(self, usuario: str) -> bool: ...

    async def enviar(self, usuario: str, mensaje: dict) -> None: ...

    async def desconectar(self, usuario: str) -> None: ...
