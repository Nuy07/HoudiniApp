"""Versiones en memoria de los contratos: permiten probar los servicios sin base de datos ni internet."""
from app.dominio.entidades import AlertaGuardada, Credencial, SesionNueva, Usuario, Vinculo
from app.dominio.errores import Conflicto


class UsuariosEnMemoria:
    def __init__(self, sesiones: "SesionesEnMemoria"):
        self._sesiones, self.todos = sesiones, {}

    def registrar(self, usuario: str, sal: str, huella: str, sesion: SesionNueva) -> None:
        if usuario in self.todos:
            raise Conflicto("Ese usuario ya existe.")
        self.todos[usuario] = Credencial(len(self.todos) + 1, usuario, sal, huella)
        self._sesiones.nombres[self.todos[usuario].id] = usuario
        self._sesiones.abrir(self.todos[usuario].id, sesion)

    def credencial(self, usuario: str) -> Credencial | None:
        return self.todos.get(usuario)

    def eliminar(self, id_usuario: int) -> None:
        self.todos = {k: v for k, v in self.todos.items() if v.id != id_usuario}


class SesionesEnMemoria:
    def __init__(self):
        self.nombres, self._abiertas = {}, {}

    def abrir(self, id_usuario: int, sesion: SesionNueva) -> None:
        self._abiertas[sesion.huella] = id_usuario

    def usuario(self, huella: str) -> Usuario | None:
        n = self._abiertas.get(huella)
        return Usuario(n, self.nombres[n]) if n else None

    def cerrar(self, huella: str) -> None:
        self._abiertas.pop(huella, None)


class HuellasSimples:
    def crear(self, clave: str) -> tuple[str, str]:
        return "sal", clave

    def coincide(self, clave: str, credencial: Credencial | None) -> bool:
        return credencial is not None and credencial.hash == clave


class MensajeroFalso:
    def __init__(self, conectados=()):
        self.enviados, self.desconectados, self._conectados = [], [], set(conectados)

    def conectado(self, usuario: str) -> bool:
        return usuario in self._conectados

    async def enviar(self, usuario: str, mensaje: dict) -> None:
        self.enviados.append((usuario, mensaje))

    async def desconectar(self, usuario: str) -> None:
        self.desconectados.append(usuario)


class ComplicesEnMemoria:
    def __init__(self, vinculos: list[Vinculo]):
        self._vinculos = vinculos

    def listar(self, yo: int) -> list[Vinculo]:
        return self._vinculos

    def pedir(self, yo: int, otro: str) -> None: ...

    def aceptar(self, yo: int, otro: str) -> bool:
        return False

    def quitar(self, yo: int, otro: str) -> None: ...


class AlertasEnMemoria:
    def __init__(self, para: list[str]):
        self.para, self.recibidas = para, []

    def guardar(self, yo: int, alerta) -> list[AlertaGuardada]:
        return [AlertaGuardada(i, p, 0) for i, p in enumerate(self.para, 1)]

    def pendientes(self, yo: int) -> list:
        return []

    def marcar_recibida(self, yo: int, id_alerta: int) -> None:
        self.recibidas.append(id_alerta)


class TiendaEnMemoria:
    def __init__(self):
        self.publicados, self.tipo = [], None

    def buscar(self, tipo: str, texto: str) -> list:
        self.tipo = tipo
        return []

    def totales(self) -> list:
        return []

    def publicar(self, id_autor: int, paquete) -> int:
        self.publicados.append(paquete)
        return len(self.publicados)

    def descargar(self, id_paquete: int):
        return None

    def retirar(self, id_autor: int, id_paquete: int) -> bool:
        return False
