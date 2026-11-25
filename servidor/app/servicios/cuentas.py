import asyncio
import re

from app.dominio.entidades import Acceso, Usuario
from app.dominio.errores import DatosInvalidos, NoAutorizado
from app.dominio.puertos import Huellas, Mensajero, RepositorioUsuarios

from .limitadores import LimitadorIntentos
from .sesiones import ServicioSesiones


class ServicioCuentas:
    def __init__(self, usuarios: RepositorioUsuarios, sesiones: ServicioSesiones, huellas: Huellas,
                 limitador: LimitadorIntentos, mensajero: Mensajero):
        self._usuarios, self._sesiones, self._huellas = usuarios, sesiones, huellas
        self._limitador, self._mensajero = limitador, mensajero

    def registrar(self, usuario: str, clave: str) -> Acceso:
        usuario = self._normalizar(usuario)
        if not re.fullmatch(r"[a-z0-9_]{3,20}", usuario):
            raise DatosInvalidos("Usuario de 3 a 20 letras, números o guion bajo.")
        sal, huella = self._huellas.crear(clave)
        token, sesion = self._sesiones.preparar()
        self._usuarios.registrar(usuario, sal, huella, sesion)
        return Acceso(usuario, token)

    def entrar(self, usuario: str, clave: str) -> Acceso:
        usuario = self._normalizar(usuario)
        self._limitador.contar(usuario)
        credencial = self._usuarios.credencial(usuario)
        # Si no existe se compara igual, para no revelar qué usuarios hay.
        if not self._huellas.coincide(clave, credencial) or credencial is None:
            raise NoAutorizado("Usuario o contraseña incorrectos.")
        return Acceso(credencial.usuario, self._sesiones.abrir(credencial.id))

    async def eliminar(self, yo: Usuario) -> None:
        await asyncio.to_thread(self._usuarios.eliminar, yo.id)
        await self._mensajero.desconectar(yo.usuario)

    @staticmethod
    def _normalizar(usuario: str) -> str:
        return usuario.strip().lower()
