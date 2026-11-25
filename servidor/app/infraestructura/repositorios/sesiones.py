import psycopg

from app.dominio.entidades import SesionNueva, Usuario

from .base import RepositorioPostgres


def insertar_sesion(db: psycopg.Connection, id_usuario: int, sesion: SesionNueva) -> None:
    """Se usa dentro de una transacción ya abierta."""
    db.execute("DELETE FROM sesiones WHERE expira < now()")
    db.execute(
        """INSERT INTO sesiones (token_hash, usuario_id, expira)
           VALUES (%s, %s, now() + make_interval(days => %s))""", (sesion.huella, id_usuario, sesion.dias))


class SesionesPostgres(RepositorioPostgres):
    def abrir(self, id_usuario: int, sesion: SesionNueva) -> None:
        with self._bd.conexion() as db:
            insertar_sesion(db, id_usuario, sesion)

    def usuario(self, huella: str) -> Usuario | None:
        return self._uno(
            Usuario,
            """SELECT u.id, u.usuario FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
               WHERE s.token_hash = %s AND s.expira > now()""", (huella,))

    def cerrar(self, huella: str) -> None:
        self._ejecutar("DELETE FROM sesiones WHERE token_hash = %s", (huella,))
