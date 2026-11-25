from psycopg.rows import class_row

from app.infraestructura.base_datos import BaseDatos


class RepositorioPostgres:
    """Lo común de los repositorios: consultar y convertir filas en entidades."""

    def __init__(self, bd: BaseDatos):
        self._bd = bd

    def _todos(self, entidad, sql: str, datos=None) -> list:
        with self._bd.conexion() as db, db.cursor(row_factory=class_row(entidad)) as c:
            return c.execute(sql, datos).fetchall()

    def _uno(self, entidad, sql: str, datos=None):
        with self._bd.conexion() as db, db.cursor(row_factory=class_row(entidad)) as c:
            return c.execute(sql, datos).fetchone()

    def _ejecutar(self, sql: str, datos=None) -> int:
        """Devuelve cuántas filas cambiaron."""
        with self._bd.conexion() as db:
            return db.execute(sql, datos).rowcount
