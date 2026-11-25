from psycopg.errors import UniqueViolation

from app.dominio.entidades import Vinculo
from app.dominio.errores import Conflicto, NoEncontrado

from .base import RepositorioPostgres


class ComplicesPostgres(RepositorioPostgres):
    def listar(self, yo: int) -> list[Vinculo]:
        return self._todos(
            Vinculo,
            """SELECT u.usuario, c.aceptado, c.solicitante_id = %(yo)s AS enviada
               FROM complices c
               JOIN usuarios u ON u.id = CASE WHEN c.solicitante_id = %(yo)s THEN c.destinatario_id ELSE c.solicitante_id END
               WHERE c.solicitante_id = %(yo)s OR c.destinatario_id = %(yo)s
               ORDER BY c.aceptado DESC, u.usuario""", {"yo": yo})

    def pedir(self, yo: int, otro: str) -> None:
        with self._bd.conexion() as db:
            u = db.execute("SELECT id FROM usuarios WHERE usuario = %s", (otro,)).fetchone()
            if not u:
                raise NoEncontrado("Ese usuario no existe.")
            try:
                db.execute("INSERT INTO complices (solicitante_id, destinatario_id) VALUES (%s, %s)", (yo, u["id"]))
            except UniqueViolation:  # el índice complices_pareja cubre ambos sentidos
                raise Conflicto("Ya hay una solicitud o vínculo.")

    def aceptar(self, yo: int, otro: str) -> bool:
        return self._ejecutar(
            """UPDATE complices c SET aceptado = true FROM usuarios u
               WHERE u.usuario = %s AND c.solicitante_id = u.id AND c.destinatario_id = %s AND NOT c.aceptado""",
            (otro, yo)) > 0

    def quitar(self, yo: int, otro: str) -> None:
        self._ejecutar(
            """DELETE FROM complices c USING usuarios u WHERE u.usuario = %(otro)s
               AND ((c.solicitante_id = %(yo)s AND c.destinatario_id = u.id)
                 OR (c.solicitante_id = u.id AND c.destinatario_id = %(yo)s))""", {"yo": yo, "otro": otro})
