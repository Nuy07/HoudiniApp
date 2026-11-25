"""Crea la aplicación web a partir de la configuración."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.errores import registrar_errores
from app.api.middleware import registrar_middleware
from app.api.rutas import alertas, complices, cuentas, estado, respaldos, tienda, tiempo_real
from app.configuracion import Configuracion
from app.contenedor import Contenedor


def crear_app(configuracion: Configuracion) -> FastAPI:
    contenedor = Contenedor(configuracion)

    @asynccontextmanager
    async def ciclo(_: FastAPI):
        contenedor.bd.abrir()
        yield
        contenedor.bd.cerrar()

    app = FastAPI(title="HoudiniApp", lifespan=ciclo)
    app.state.contenedor = contenedor
    registrar_middleware(app)
    registrar_errores(app)
    for modulo in (estado, cuentas, respaldos, tienda, complices, alertas):
        app.include_router(modulo.router, prefix="/api")
    app.include_router(tiempo_real.router)
    return app
