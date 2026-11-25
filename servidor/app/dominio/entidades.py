"""Objetos del negocio: solo datos, sin base ni web."""
from dataclasses import dataclass
from datetime import datetime


# ---------- Cuentas ----------
@dataclass(frozen=True)
class Usuario:
    id: int
    usuario: str


@dataclass(frozen=True)
class Credencial:
    """Lo que se guarda para comprobar la clave. Nunca la contraseña."""
    id: int
    usuario: str
    sal: str
    hash: str


@dataclass(frozen=True)
class SesionNueva:
    huella: str  # huella del token, no el token
    dias: int


@dataclass(frozen=True)
class Acceso:
    """Lo que recibe la app al entrar."""
    usuario: str
    token: str


# ---------- Respaldo ----------
@dataclass(frozen=True)
class Respaldo:
    iv: str
    datos: str
    actualizado: datetime


# ---------- Tienda ----------
@dataclass(frozen=True)
class PaqueteNuevo:
    tipo: str
    nombre: str
    descripcion: str
    contenido: dict


@dataclass(frozen=True)
class PaqueteResumen:
    id: int
    tipo: str
    nombre: str
    descripcion: str
    descargas: int
    autor: str


@dataclass(frozen=True)
class PaqueteDescargado:
    tipo: str
    nombre: str
    contenido: dict


@dataclass(frozen=True)
class TotalPorTipo:
    tipo: str
    total: int


@dataclass(frozen=True)
class Catalogo:
    paquetes: list[PaqueteResumen]
    totales: list[TotalPorTipo]


# ---------- Cómplices y alertas ----------
@dataclass(frozen=True)
class Vinculo:
    usuario: str
    aceptado: bool
    enviada: bool


@dataclass(frozen=True)
class AlertaNueva:
    mensaje: str
    lat: float | None
    lng: float | None


@dataclass(frozen=True)
class AlertaGuardada:
    id: int
    para: str
    creada: int  # milisegundos


@dataclass(frozen=True)
class AlertaPendiente:
    id: int
    de: str
    mensaje: str
    lat: float | None
    lng: float | None
    creada: int


@dataclass(frozen=True)
class ResultadoAlerta:
    enviadas: int
    en_linea: int
