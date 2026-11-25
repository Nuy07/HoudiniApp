"""Forma de los datos que entran por la API."""
from pydantic import BaseModel, Field

BASE64 = r"^[A-Za-z0-9+/]+=*$"


class Credenciales(BaseModel):
    # La app nunca manda la contraseña: manda una clave derivada (64 hex).
    usuario: str = Field(max_length=60)
    clave: str = Field(pattern=r"^[0-9a-f]{64}$")


class RespaldoCifrado(BaseModel):
    iv: str = Field(max_length=32, pattern=BASE64)
    datos: str = Field(max_length=1_000_000, pattern=BASE64)


class Paquete(BaseModel):
    tipo: str
    nombre: str
    descripcion: str
    contenido: dict


class NuevoComplice(BaseModel):
    usuario: str = Field(max_length=60)


class Alerta(BaseModel):
    mensaje: str = Field(max_length=1000)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)


class Situacion(BaseModel):
    situacion: str = Field(max_length=1000)
    evitar: str = Field(default="", max_length=100)
