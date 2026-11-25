from psycopg.errors import UniqueViolation

from app.dominio.entidades import Credencial, SesionNueva
from app.dominio.errores import Conflicto

from .base import RepositorioPostgres
from .sesiones import insertar_sesion


class UsuariosPostgres(RepositorioPostgres):
    def registrar(self, usuario: str, sal: str, huella: str, sesion: SesionNueva) -> None:
        with self._bd.conexion() as db:
            try:
                nuevo = db.execute("INSERT INTO usuarios (usuario, sal, hash) VALUES (%s, %s, %s) RETURNING id",
                                   (usuario, sal, huella)).fetchone()
            except UniqueViolation:
                raise Conflicto("Ese usuario ya existe.")
            insertar_sesion(db, nuevo["id"], sesion)

    def credencial(self, usuario: str) -> Credencial | None:
        return self._uno(Credencial, "SELECT id, usuario, sal, hash FROM usuarios WHERE usuario = %s", (usuario,))

    def eliminar(self, id_usuario: int) -> None:
        # Sesiones, respaldo, publicaciones, cómplices y alertas se borran en cascada.
        self._ejecutar("DELETE FROM usuarios WHERE id = %s", (id_usuario,))
