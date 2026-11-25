from psycopg.types.json import Jsonb

from app.dominio.entidades import PaqueteDescargado, PaqueteNuevo, PaqueteResumen, TotalPorTipo

from .base import RepositorioPostgres


class TiendaPostgres(RepositorioPostgres):
    def buscar(self, tipo: str, texto: str) -> list[PaqueteResumen]:
        return self._todos(
            PaqueteResumen,
            """SELECT m.id, m.tipo, m.nombre, m.descripcion, m.descargas,
                 COALESCE(u.usuario, 'HoudiniApp') AS autor
               FROM marketplace m LEFT JOIN usuarios u ON u.id = m.autor_id
               WHERE (%(tipo)s = '' OR m.tipo = %(tipo)s)
                 AND (strpos(lower(m.nombre), lower(%(q)s)) > 0 OR strpos(lower(m.descripcion), lower(%(q)s)) > 0)
               ORDER BY m.descargas DESC, m.id LIMIT 100""", {"tipo": tipo, "q": texto})

    def totales(self) -> list[TotalPorTipo]:
        return self._todos(TotalPorTipo, "SELECT tipo, COUNT(*) AS total FROM marketplace GROUP BY tipo")

    def publicar(self, id_autor: int, paquete: PaqueteNuevo) -> int:
        with self._bd.conexion() as db:
            return db.execute(
                """INSERT INTO marketplace (tipo, nombre, descripcion, contenido, autor_id)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (paquete.tipo, paquete.nombre, paquete.descripcion, Jsonb(paquete.contenido), id_autor)).fetchone()["id"]

    def descargar(self, id_paquete: int) -> PaqueteDescargado | None:
        return self._uno(
            PaqueteDescargado,
            "UPDATE marketplace SET descargas = descargas + 1 WHERE id = %s RETURNING tipo, nombre, contenido",
            (id_paquete,))

    def retirar(self, id_autor: int, id_paquete: int) -> bool:
        return self._ejecutar("DELETE FROM marketplace WHERE id = %s AND autor_id = %s", (id_paquete, id_autor)) > 0
