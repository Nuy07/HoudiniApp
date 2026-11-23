"""Conexión con Supabase (PostgreSQL)."""
import os
from pathlib import Path

from dotenv import load_dotenv
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

# En Render la variable ya existe; en tu computadora se lee de servidor/.env.
load_dotenv(Path(__file__).parent / ".env")
URL = os.environ.get("DATABASE_URL", "").strip()
if not URL or "[YOUR" in URL:
    raise SystemExit("Falta DATABASE_URL. Copia .env.example como .env y pon tu cadena de Supabase.")

opciones = {"row_factory": dict_row, "connect_timeout": 15}
if "sslmode=" not in URL:
    opciones["sslmode"] = "require"

# Conexiones abiertas que se reutilizan. Antes de prestar una se revisa que siga viva.
grupo = ConnectionPool(URL, kwargs=opciones, min_size=1, max_size=int(os.environ.get("BD_CONEXIONES", 5)),
                       timeout=15, max_idle=300, check=ConnectionPool.check_connection, open=False)


def abrir():
    """with abrir() as db: confirma los cambios al terminar, o los deshace si hay error."""
    return grupo.connection()


def limpio(valor, maximo: int):
    """Texto sin espacios sobrantes, o None si está vacío o es muy largo."""
    if not isinstance(valor, str):
        return None
    valor = valor.strip()
    return valor if 0 < len(valor) <= maximo else None
