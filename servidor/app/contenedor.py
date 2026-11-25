"""Arma todas las piezas. Es el único lugar que sabe qué clase concreta usa cada servicio."""
from app.configuracion import Configuracion
from app.dominio.contenido import VALIDADORES
from app.infraestructura.base_datos import BaseDatos
from app.infraestructura.conexiones import ConexionesWebSocket
from app.infraestructura.huellas import HuellasScrypt
from app.infraestructura.repositorios.alertas import AlertasPostgres
from app.infraestructura.repositorios.complices import ComplicesPostgres
from app.infraestructura.repositorios.respaldos import RespaldosPostgres
from app.infraestructura.repositorios.sesiones import SesionesPostgres
from app.infraestructura.repositorios.tienda import TiendaPostgres
from app.infraestructura.repositorios.usuarios import UsuariosPostgres
from app.servicios.alertas import ServicioAlertas
from app.servicios.complices import ServicioComplices
from app.servicios.cuentas import ServicioCuentas
from app.servicios.limitadores import LimitadorIntentos, Pausa
from app.servicios.respaldos import ServicioRespaldos
from app.servicios.sesiones import ServicioSesiones
from app.servicios.tienda import ServicioTienda


class Contenedor:
    def __init__(self, configuracion: Configuracion):
        self.configuracion = configuracion
        self.bd = bd = BaseDatos(configuracion.url_bd, configuracion.conexiones)
        self.conexiones = ConexionesWebSocket()
        # Cada 10 minutos: 20 intentos por dirección y 60 por usuario.
        self.limite_direccion = LimitadorIntentos(maximo=20)

        self.sesiones = ServicioSesiones(SesionesPostgres(bd))
        self.cuentas = ServicioCuentas(UsuariosPostgres(bd), self.sesiones, HuellasScrypt(),
                                       LimitadorIntentos(maximo=60), self.conexiones)
        self.respaldos = ServicioRespaldos(RespaldosPostgres(bd))
        self.tienda = ServicioTienda(TiendaPostgres(bd), VALIDADORES)
        self.complices = ServicioComplices(ComplicesPostgres(bd), self.conexiones)
        self.alertas = ServicioAlertas(AlertasPostgres(bd), self.conexiones, Pausa(segundos=3))
