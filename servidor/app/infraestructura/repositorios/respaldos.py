from app.dominio.entidades import Respaldo

from .base import RepositorioPostgres


class RespaldosPostgres(RepositorioPostgres):
    def leer(self, id_usuario: int) -> Respaldo | None:
        return self._uno(Respaldo, "SELECT iv, datos, actualizado FROM respaldos WHERE usuario_id = %s", (id_usuario,))

    def guardar(self, id_usuario: int, iv: str, datos: str) -> None:
        self._ejecutar(
            """INSERT INTO respaldos (usuario_id, iv, datos) VALUES (%s, %s, %s)
               ON CONFLICT (usuario_id) DO UPDATE SET iv = excluded.iv, datos = excluded.datos,
               actualizado = now()""", (id_usuario, iv, datos))
