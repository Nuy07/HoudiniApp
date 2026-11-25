"""Cuida que las capas no se mezclen."""
import re
import unittest

from app.configuracion import RAIZ

PROHIBIDO = {
    "dominio": r"fastapi|starlette|psycopg|pydantic|app\.(servicios|infraestructura|api)",
    "servicios": r"fastapi|starlette|psycopg|pydantic|app\.(infraestructura|api)",
    "infraestructura": r"app\.(servicios|api)",
    "api": r"psycopg",
}


class Capas(unittest.TestCase):
    def test_dependencias(self):
        for capa, patron in PROHIBIDO.items():
            archivos = list((RAIZ / "app" / capa).rglob("*.py"))
            self.assertTrue(archivos)
            for archivo in archivos:
                malo = re.search(rf"^\s*(from|import) ({patron})", archivo.read_text("utf-8"), re.M)
                self.assertIsNone(malo, f"{archivo.name} ({capa}): {malo and malo.group(0)}")
