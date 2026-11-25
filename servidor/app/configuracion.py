"""Ajustes del servidor. Es el único lugar que lee variables de entorno."""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

RAIZ = Path(__file__).parents[1]


@dataclass(frozen=True)
class Configuracion:
    url_bd: str
    conexiones: int = 5
    puerto: int = 8000
    tras_proxy: bool = False  # en Render la dirección real del cliente llega en una cabecera

    @classmethod
    def desde_entorno(cls) -> "Configuracion":
        # En Render la variable ya existe; en tu computadora se lee de servidor/.env.
        load_dotenv(RAIZ / ".env")
        url = os.environ.get("DATABASE_URL", "").strip()
        if not url or "[YOUR" in url:
            raise SystemExit("Falta DATABASE_URL. Copia .env.example como .env y pon tu cadena de Supabase.")
        return cls(url_bd=url, conexiones=int(os.environ.get("BD_CONEXIONES", 5)),
                   puerto=int(os.environ.get("PORT", 8000)), tras_proxy=bool(os.environ.get("RENDER")))
