import unittest
from types import SimpleNamespace as N

import anthropic

from app.dominio.contenido import VALIDADORES
from app.dominio.entidades import Usuario
from app.dominio.errores import DatosInvalidos, DemasiadosIntentos, IaNoConfigurada, IaNoDisponible
from app.dominio.planes import ValidadorPlan
from app.infraestructura.ia_claude import PlanesClaude
from app.servicios.asistente import ServicioAsistente
from app.servicios.limitadores import LimitadorIntentos

ANA = Usuario(1, "ana")
BUENO = {"titulo": "Tubería rota", "consejo": "Contesta y despídete.", "accion": "llamada", "riesgo": False,
         "llamada": {"nombre": "Mamá", "etiqueta": "Casa", "voz": {"nombre": "Mamá", "rate": 9, "pitch": 1, "guion": ["Hola"]}},
         "mensajes": [{"de": "Mamá", "texto": "Ven"}, {"de": "", "texto": "x"}, "basura"]}


class GeneradorFalso:
    def __init__(self, plan):
        self.plan, self.pedidos = plan, []

    def generar(self, situacion, evitar):
        self.pedidos.append((situacion, evitar))
        return self.plan


def servicio(generador, maximo=5):
    return ServicioAsistente(generador, ValidadorPlan(VALIDADORES["perfil"]), LimitadorIntentos(maximo), LimitadorIntentos(99))


class Asistente(unittest.TestCase):
    def test_limpia_el_plan(self):
        g = GeneradorFalso(BUENO)
        plan = servicio(g).planear(ANA, "  una cita aburrida ", "Otro")
        self.assertEqual(g.pedidos, [("una cita aburrida", "Otro")])
        self.assertEqual(plan.llamada["voz"]["rate"], 2)
        self.assertEqual(plan.mensajes, [{"de": "Mamá", "texto": "Ven"}])

    def test_rechaza_planes_malos(self):
        for malo in ({**BUENO, "accion": "hackear"}, {**BUENO, "mensajes": []}, {**BUENO, "llamada": {}}, {}, None, []):
            with self.assertRaises(IaNoDisponible):
                servicio(GeneradorFalso(malo)).planear(ANA, "x")

    def test_limites(self):
        with self.assertRaises(IaNoConfigurada):
            servicio(None).planear(ANA, "x")
        with self.assertRaises(DatosInvalidos):
            servicio(GeneradorFalso(BUENO)).planear(ANA, "   ")
        s = servicio(GeneradorFalso(BUENO), maximo=1)
        s.planear(ANA, "x")
        with self.assertRaises(DemasiadosIntentos):
            s.planear(ANA, "x")


class Claude(unittest.TestCase):
    def responder(self, modelo="claude-opus-5-5", **respuesta):
        p, self.enviado = PlanesClaude("clave", modelo), {}

        def create(**k):
            self.enviado = k
            if "error" in respuesta:
                raise respuesta["error"]
            return N(**respuesta)
        p._cliente = N(beta=N(messages=N(create=create)))
        return p.generar("cita", "Otro")

    def test_lee_el_json(self):
        bloques = [N(type="thinking", thinking=""), N(type="text", text='{"titulo": "a"}')]
        self.assertEqual(self.responder(stop_reason="end_turn", content=bloques), {"titulo": "a"})
        self.assertEqual(self.enviado["fallbacks"], "default")
        self.assertIn("<situacion>cita</situacion>", self.enviado["messages"][0]["content"])
        self.responder("claude-haiku-5-5", stop_reason="end_turn", content=bloques)
        self.assertNotIn("fallbacks", self.enviado)

    def test_fallos(self):
        texto = [N(type="text", text="no es json")]
        for r in ({"stop_reason": "refusal", "content": []}, {"stop_reason": "max_tokens", "content": texto},
                  {"stop_reason": "end_turn", "content": texto}, {"stop_reason": "end_turn", "content": []},
                  {"error": anthropic.APIConnectionError(request=None)}):
            with self.assertRaises(IaNoDisponible):
                self.responder(**r)
