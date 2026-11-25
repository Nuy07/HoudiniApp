from app.dominio.entidades import Usuario
from app.dominio.errores import DatosInvalidos, IaNoConfigurada, IaNoDisponible
from app.dominio.planes import PlanEscape, ValidadorPlan
from app.dominio.puertos import GeneradorPlanes
from app.dominio.texto import limpio

from .limitadores import LimitadorIntentos


class ServicioAsistente:
    """Los límites cuidan el gasto: la IA en la nube se paga por uso."""

    def __init__(self, generador: GeneradorPlanes | None, validador: ValidadorPlan,
                 por_usuario: LimitadorIntentos, total: LimitadorIntentos):
        self._generador, self._validador = generador, validador
        self._por_usuario, self._total = por_usuario, total

    def planear(self, yo: Usuario, situacion: str, evitar: str = "") -> PlanEscape:
        texto = limpio(situacion, 400)
        if not texto:
            raise DatosInvalidos("Cuenta tu situación en menos de 400 letras.")
        if self._generador is None:
            raise IaNoConfigurada("La IA en la nube no está activada.")
        self._por_usuario.contar(str(yo.id))
        self._total.contar("todos")
        plan = self._validador.limpiar(self._generador.generar(texto, limpio(evitar, 60) or ""))
        if not plan:
            raise IaNoDisponible("La IA no pudo armar un plan. Intenta con otras palabras.")
        return plan
