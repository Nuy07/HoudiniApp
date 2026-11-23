"""Revisa la conexión con Supabase: python bd/probar_bd.py
Solo lee y nunca muestra la contraseña."""
import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

TABLAS = ["usuarios", "sesiones", "respaldos", "marketplace", "complices", "alertas"]


def main():
    load_dotenv(Path(__file__).parents[1] / ".env")
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url or "[YOUR" in url:
        sys.exit("Falta DATABASE_URL en servidor/.env (copia .env.example y pon tu contraseña).")
    try:
        db = psycopg.connect(url, sslmode="require", connect_timeout=15)
    except (psycopg.OperationalError, psycopg.ProgrammingError) as e:
        motivo = str(e).lower()
        if "password" in motivo:
            sys.exit("Contraseña incorrecta en DATABASE_URL.")
        if "resolve" in motivo or "getaddrinfo" in motivo or "timeout" in motivo:
            sys.exit("No se encontró el servidor. Usa la cadena 'Session pooler' de Supabase.")
        sys.exit("No se pudo conectar. Revisa que DATABASE_URL esté completa y bien escrita.")

    with db:
        filas = db.execute(
            """SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
               WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY(%s)""", (TABLAS,)).fetchall()
        rls = dict(filas)
        faltan = [t for t in TABLAS if t not in rls]
        if faltan:
            sys.exit(f"Conexión correcta, pero faltan tablas: {', '.join(faltan)}. Ejecuta esquema.sql.")
        abiertas = [t for t in TABLAS if not rls[t]]
        if abiertas:
            sys.exit(f"Tablas sin protección (RLS): {', '.join(abiertas)}. Ejecuta otra vez esquema.sql.")
        oficiales = db.execute("SELECT count(*) FROM public.marketplace WHERE autor_id IS NULL").fetchone()[0]
        if oficiales == 0:
            sys.exit("Tablas correctas, pero la tienda está vacía. Ejecuta datos.sql.")
        print(f"Todo correcto: {len(TABLAS)} tablas protegidas y {oficiales} paquetes en la tienda.")


if __name__ == "__main__":
    main()
