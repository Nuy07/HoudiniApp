"""Conexión con Supabase (PostgreSQL)."""
from collections.abc import Iterator
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool, PoolTimeout

from app.dominio.errores import BaseNoDisponible, DatosInvalidos


class BaseDatos:
    def __init__(self, url: str, conexiones: int = 5):
        # Sin consultas preparadas: detrás de un pooler, como el de Supabase, pueden chocar entre conexiones.
        opciones = {"row_factory": dict_row, "connect_timeout": 15, "prepare_threshold": None}
        if "sslmode=" not in url:
            opciones["sslmode"] = "require"
        # Conexiones abiertas que se reutilizan. Antes de prestar una se revisa que siga viva.
        self._grupo = ConnectionPool(url, kwargs=opciones, min_size=1, max_size=conexiones, timeout=15, max_idle=300,
                                     check=ConnectionPool.check_connection, open=False)

    def abrir(self) -> None:
        self._grupo.open()

    def cerrar(self) -> None:
        self._grupo.close()

    @contextmanager
    def conexion(self) -> Iterator[psycopg.Connection]:
        """Confirma los cambios al terminar, o los deshace si hay error.
        Los errores de PostgreSQL salen como errores del negocio."""
        try:
            with self._grupo.connection() as db:
                yield db
        except (psycopg.OperationalError, PoolTimeout) as e:
            raise BaseNoDisponible(type(e).__name__) from e
        except psycopg.DataError as e:  # textos que PostgreSQL no acepta, como el carácter nulo
            raise DatosInvalidos("Petición no válida.") from e
