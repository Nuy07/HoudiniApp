"""Frenos contra el abuso. Viven en memoria."""
import time
from collections.abc import Callable

from app.dominio.errores import DemasiadosIntentos

Reloj = Callable[[], float]
MAX_CLAVES = 5000


class LimitadorIntentos:
    """Máximo de intentos por clave en cada ventana de tiempo."""

    def __init__(self, maximo: int, ventana: float = 600, reloj: Reloj = time.time,
                 aviso: str = "Demasiados intentos. Espera unos minutos."):
        self._maximo, self._ventana, self._reloj, self._aviso = maximo, ventana, reloj, aviso
        self._intentos: dict[str, tuple[int, float]] = {}

    def contar(self, clave: str) -> None:
        ahora = self._reloj()
        if len(self._intentos) > MAX_CLAVES:
            self._intentos.clear()
        n, hasta = self._intentos.get(clave, (0, 0))
        if hasta <= ahora:
            n, hasta = 0, ahora + self._ventana
        self._intentos[clave] = (n + 1, hasta)
        if n + 1 > self._maximo:
            raise DemasiadosIntentos(self._aviso)


class Pausa:
    """Tiempo mínimo entre dos acciones de la misma persona."""

    def __init__(self, segundos: float, reloj: Reloj = time.time):
        self._segundos, self._reloj = segundos, reloj
        self._ultima: dict[int, float] = {}

    def tomar(self, quien: int) -> None:
        ahora = self._reloj()
        if ahora - self._ultima.get(quien, 0) < self._segundos:
            raise DemasiadosIntentos("Espera unos segundos.")
        if len(self._ultima) > MAX_CLAVES:
            self._ultima.clear()
        self._ultima[quien] = ahora

    def soltar(self, quien: int) -> None:
        self._ultima.pop(quien, None)
