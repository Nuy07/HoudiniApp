"""Plan de escape que propone la IA. Lo que responde un modelo se limpia igual que lo de cualquier usuario."""
from dataclasses import dataclass

from .contenido import ValidadorContenido
from .texto import limpio

ACCIONES = ("llamada", "bomba")


@dataclass(frozen=True)
class PlanEscape:
    titulo: str
    consejo: str
    accion: str
    riesgo: bool  # parece una emergencia real
    llamada: dict
    mensajes: list[dict]


class ValidadorPlan:
    def __init__(self, perfil: ValidadorContenido):
        self._perfil = perfil

    def limpiar(self, d) -> PlanEscape | None:
        """Plan listo para la app, o None si le falta algo."""
        if not isinstance(d, dict):
            return None
        titulo, consejo = limpio(d.get("titulo"), 60), limpio(d.get("consejo"), 400)
        llamada = self._perfil.limpiar(d.get("llamada"))
        mensajes = self._mensajes(d.get("mensajes"))
        if not (titulo and consejo and llamada and mensajes and d.get("accion") in ACCIONES):
            return None
        return PlanEscape(titulo, consejo, d["accion"], d.get("riesgo") is True, llamada, mensajes)

    @staticmethod
    def _mensajes(lista) -> list[dict]:
        if not isinstance(lista, list):
            return []
        pares = ((limpio(m.get("de"), 40), limpio(m.get("texto"), 160)) for m in lista[:8] if isinstance(m, dict))
        return [{"de": de, "texto": texto} for de, texto in pares if de and texto]
