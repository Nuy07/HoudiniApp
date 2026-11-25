"""Pruebas rápidas de los servicios: python -m unittest"""
import unittest

from app.dominio.contenido import VALIDADORES
from app.dominio.entidades import PaqueteNuevo, Usuario, Vinculo
from app.dominio.errores import Conflicto, DatosInvalidos, DemasiadosIntentos, NoAutorizado, NoEncontrado
from app.servicios.alertas import ServicioAlertas
from app.servicios.complices import ServicioComplices
from app.servicios.cuentas import ServicioCuentas
from app.servicios.limitadores import LimitadorIntentos, Pausa
from app.servicios.sesiones import ServicioSesiones
from app.servicios.tienda import ServicioTienda

from . import memoria as m

ANA = Usuario(1, "ana")


class Cuentas(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        sesiones = m.SesionesEnMemoria()
        self.mensajero, self.sesiones = m.MensajeroFalso(), ServicioSesiones(sesiones)
        self.cuentas = ServicioCuentas(m.UsuariosEnMemoria(sesiones), self.sesiones, m.HuellasSimples(),
                                       LimitadorIntentos(maximo=3), self.mensajero)

    def test_registro_abre_sesion(self):
        acceso = self.cuentas.registrar(" Ana ", "x")
        self.assertEqual(self.sesiones.usuario_de(acceso.token), ANA)
        self.sesiones.cerrar(acceso.token)
        self.assertIsNone(self.sesiones.usuario_de(acceso.token))

    def test_registro_no_valido(self):
        self.cuentas.registrar("ana", "x")
        self.assertRaises(Conflicto, self.cuentas.registrar, "ana", "x")
        self.assertRaises(DatosInvalidos, self.cuentas.registrar, "a b", "x")

    def test_entrar_y_limite(self):
        self.cuentas.registrar("ana", "x")
        self.assertEqual(self.cuentas.entrar("ANA", "x").usuario, "ana")
        self.assertRaises(NoAutorizado, self.cuentas.entrar, "ana", "mala")
        self.assertRaises(NoAutorizado, self.cuentas.entrar, "ana", "mala")
        self.assertRaises(DemasiadosIntentos, self.cuentas.entrar, "ana", "x")

    async def test_eliminar_desconecta(self):
        await self.cuentas.eliminar(ANA)
        self.assertEqual(self.mensajero.desconectados, ["ana"])


class Tienda(unittest.TestCase):
    def setUp(self):
        self.repo = m.TiendaEnMemoria()
        self.tienda = ServicioTienda(self.repo, VALIDADORES)

    def test_publica_limpio(self):
        self.tienda.publicar(ANA, PaqueteNuevo("voz", " Mía ", "x", {"guion": [" hola ", "", 3], "rate": 99, "otro": 1}))
        self.assertEqual(self.repo.publicados[0].contenido, {"nombre": "Voz", "rate": 2, "pitch": 1, "guion": ["hola"]})

    def test_rechaza(self):
        for tipo, contenido in (("voz", {"guion": []}), ("otro", {"guion": ["a"]}), ("perfil", {"nombre": "x"})):
            self.assertRaises(DatosInvalidos, self.tienda.publicar, ANA, PaqueteNuevo(tipo, "a", "b", contenido))
        self.assertRaises(NoEncontrado, self.tienda.descargar, 2**64)
        self.assertRaises(NoEncontrado, self.tienda.retirar, ANA, 5)

    def test_tipo_desconocido_busca_todo(self):
        self.tienda.buscar("x'; --", "")
        self.assertEqual(self.repo.tipo, "")


class Red(unittest.IsolatedAsyncioTestCase):
    async def test_en_linea_solo_si_acepto(self):
        s = ServicioComplices(m.ComplicesEnMemoria([Vinculo("beto", True, True), Vinculo("caro", False, True)]),
                              m.MensajeroFalso(["beto", "caro"]))
        self.assertEqual([e for _, e in await s.listar(ANA)], [True, False])
        with self.assertRaises(DatosInvalidos):
            await s.pedir(ANA, "ANA ")
        with self.assertRaises(NoEncontrado):
            await s.aceptar(ANA, "beto")

    async def test_alerta(self):
        ahora, mensajero, repo = [100.0], m.MensajeroFalso(["beto"]), m.AlertasEnMemoria([])
        s = ServicioAlertas(repo, mensajero, Pausa(3, lambda: ahora[0]))
        with self.assertRaises(DatosInvalidos):  # sin cómplices, y no gasta la pausa
            await s.enviar(ANA, "ayuda", None, None)
        repo.para = ["beto", "caro"]
        r = await s.enviar(ANA, "ayuda", 20.0, None)
        self.assertEqual((r.enviadas, r.en_linea), (2, 1))
        self.assertIsNone(mensajero.enviados[0][1]["lat"])  # ubicación completa o ninguna
        with self.assertRaises(DemasiadosIntentos):
            await s.enviar(ANA, "ayuda", None, None)
        ahora[0] += 4
        await s.enviar(ANA, "ayuda", None, None)

    async def test_recibida_no_valida(self):
        repo = m.AlertasEnMemoria([])
        s = ServicioAlertas(repo, m.MensajeroFalso(), Pausa(3))
        for dato in ("x", True, 0, 2**63, None, 7):
            await s.marcar_recibida(ANA, dato)
        self.assertEqual(repo.recibidas, [7])
