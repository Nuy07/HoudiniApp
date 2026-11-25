from psycopg.rows import class_row

from app.dominio.entidades import AlertaGuardada, AlertaNueva, AlertaPendiente

from .base import RepositorioPostgres

# La hora viaja a la app en milisegundos.
MILISEGUNDOS = "(extract(epoch FROM creada) * 1000)::bigint AS creada"


class AlertasPostgres(RepositorioPostgres):
    def guardar(self, yo: int, alerta: AlertaNueva) -> list[AlertaGuardada]:
        with self._bd.conexion() as db, db.cursor(row_factory=class_row(AlertaGuardada)) as c:
            # Privacidad: las alertas (pueden llevar ubicación) se borran a los 7 días.
            c.execute("DELETE FROM alertas WHERE creada < now() - interval '7 days'")
            return c.execute(
                f"""WITH nuevas AS (
                      INSERT INTO alertas (de_id, para_id, mensaje, lat, lng)
                      SELECT %(yo)s, CASE WHEN solicitante_id = %(yo)s THEN destinatario_id ELSE solicitante_id END,
                             %(mensaje)s, %(lat)s, %(lng)s
                      FROM complices WHERE aceptado AND (solicitante_id = %(yo)s OR destinatario_id = %(yo)s)
                      RETURNING id, para_id, creada)
                    SELECT n.id, u.usuario AS para, {MILISEGUNDOS} FROM nuevas n JOIN usuarios u ON u.id = n.para_id""",
                {"yo": yo, "mensaje": alerta.mensaje, "lat": alerta.lat, "lng": alerta.lng}).fetchall()

    def pendientes(self, yo: int) -> list[AlertaPendiente]:
        return self._todos(
            AlertaPendiente,
            f"""SELECT a.id, u.usuario AS de, a.mensaje, a.lat, a.lng, {MILISEGUNDOS}
                FROM alertas a JOIN usuarios u ON u.id = a.de_id
                WHERE a.para_id = %s AND NOT a.entregada ORDER BY a.id""", (yo,))

    def marcar_recibida(self, yo: int, id_alerta: int) -> None:
        self._ejecutar("UPDATE alertas SET entregada = true WHERE id = %s AND para_id = %s", (id_alerta, yo))
