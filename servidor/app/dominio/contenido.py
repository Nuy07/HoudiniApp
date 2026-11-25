"""Reglas para lo que se publica en la tienda. El contenido público se limpia campo por campo.
Para un tipo nuevo basta con crear su clase y agregarla en VALIDADORES."""
import math
from typing import Protocol

from .texto import limpio


class ValidadorContenido(Protocol):
    def limpiar(self, contenido) -> dict | None:
        """Copia limpia, o None si no sirve."""


class ValidadorVoz:
    def limpiar(self, contenido) -> dict | None:
        if not isinstance(contenido, dict) or not isinstance(contenido.get("guion"), list):
            return None
        guion = [t for t in (limpio(x, 200) for x in contenido["guion"][:20]) if t]
        if not guion:
            return None
        return {"nombre": limpio(contenido.get("nombre"), 60) or "Voz", "rate": self._numero(contenido.get("rate")),
                "pitch": self._numero(contenido.get("pitch")), "guion": guion}

    @staticmethod
    def _numero(n) -> float:
        valido = isinstance(n, (int, float)) and not isinstance(n, bool) and math.isfinite(n)
        return min(2, max(0.5, n)) if valido else 1


class ValidadorPerfil:
    def __init__(self, voz: ValidadorContenido):
        self._voz = voz

    def limpiar(self, contenido) -> dict | None:
        if not isinstance(contenido, dict):
            return None
        nombre, voz = limpio(contenido.get("nombre"), 60), self._voz.limpiar(contenido.get("voz"))
        if not nombre or not voz:
            return None
        return {"nombre": nombre, "etiqueta": limpio(contenido.get("etiqueta"), 40) or "Móvil", "voz": voz}


VALIDADORES: dict[str, ValidadorContenido] = {"voz": ValidadorVoz(), "perfil": ValidadorPerfil(ValidadorVoz())}
