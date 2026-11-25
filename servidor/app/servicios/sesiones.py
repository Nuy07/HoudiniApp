import hashlib
import secrets

from app.dominio.entidades import SesionNueva, Usuario
from app.dominio.puertos import RepositorioSesiones


class ServicioSesiones:
    DIAS = 30

    def __init__(self, sesiones: RepositorioSesiones):
        self._sesiones = sesiones

    def preparar(self) -> tuple[str, SesionNueva]:
        """Token para la app y la sesión que se guarda en la base."""
        token = secrets.token_hex(32)
        return token, SesionNueva(self._huella(token), self.DIAS)

    def abrir(self, id_usuario: int) -> str:
        token, sesion = self.preparar()
        self._sesiones.abrir(id_usuario, sesion)
        return token

    def usuario_de(self, token) -> Usuario | None:
        """Dueño del token, o None si no es válido o ya venció."""
        if not isinstance(token, str) or not token:
            return None
        return self._sesiones.usuario(self._huella(token))

    def cerrar(self, token: str) -> None:
        self._sesiones.cerrar(self._huella(token))

    @staticmethod
    def _huella(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
