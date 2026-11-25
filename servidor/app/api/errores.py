"""Todos los errores salen con la forma {"error": "..."}."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.dominio import errores as e

CODIGOS: dict[type[e.ErrorDominio], int] = {
    e.DatosInvalidos: 400, e.NoAutorizado: 401, e.NoEncontrado: 404, e.Conflicto: 409,
    e.DemasiadosIntentos: 429, e.BaseNoDisponible: 503,
}


def respuesta(texto: str, codigo: int) -> JSONResponse:
    return JSONResponse({"error": texto}, codigo)


async def _dominio(_: Request, x: e.ErrorDominio):
    if isinstance(x, e.BaseNoDisponible):
        print("Base de datos no disponible:", x.causa, flush=True)
    return respuesta(x.mensaje, CODIGOS.get(type(x), 400))


async def _http(_: Request, x: HTTPException):
    return respuesta("Ruta no encontrada." if x.detail == "Not Found" else x.detail, x.status_code)


async def _peticion(_: Request, x: Exception):
    return respuesta("Petición no válida.", 400)


async def _interno(_: Request, x: Exception):
    return respuesta("Error interno del servidor.", 500)


def registrar_errores(app: FastAPI) -> None:
    app.add_exception_handler(e.ErrorDominio, _dominio)
    app.add_exception_handler(HTTPException, _http)
    app.add_exception_handler(RequestValidationError, _peticion)
    app.add_exception_handler(UnicodeEncodeError, _peticion)
    app.add_exception_handler(Exception, _interno)
