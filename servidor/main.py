"""HoudiniApp: servidor. Se ejecuta con: python main.py"""
import os
from contextlib import asynccontextmanager

import psycopg
import uvicorn
from fastapi import Depends, FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from psycopg_pool import PoolTimeout
from starlette.exceptions import HTTPException

import nube
import tiempo_real
from base import grupo

MAX_CUERPO = 1_500_000


@asynccontextmanager
async def ciclo(_: FastAPI):
    grupo.open()
    yield
    grupo.close()


app = FastAPI(title="HoudiniApp", lifespan=ciclo)


@app.middleware("http")
async def limitar_cuerpo(request: Request, seguir):
    # Se exige el tamaño declarado para no recibir cuerpos sin límite.
    largo = request.headers.get("content-length", "0")
    if "transfer-encoding" in request.headers or not largo.isdigit() or int(largo) > MAX_CUERPO:
        return JSONResponse({"error": "Datos demasiado grandes."}, 413)
    return await seguir(request)


# Todos los errores salen con la forma {"error": "..."}.
@app.exception_handler(HTTPException)
async def error_http(_: Request, e: HTTPException):
    texto = "Ruta no encontrada." if e.detail == "Not Found" else e.detail
    return JSONResponse({"error": texto}, e.status_code)


@app.exception_handler(RequestValidationError)
async def error_datos(_: Request, e: RequestValidationError):
    return JSONResponse({"error": "Petición no válida."}, 400)


# Textos que PostgreSQL no acepta, como el carácter nulo.
@app.exception_handler(psycopg.DataError)
@app.exception_handler(UnicodeEncodeError)
async def error_texto(_: Request, e: Exception):
    return JSONResponse({"error": "Petición no válida."}, 400)


@app.exception_handler(psycopg.OperationalError)
@app.exception_handler(PoolTimeout)
async def error_base(_: Request, e: Exception):
    print("Base de datos no disponible:", type(e).__name__, flush=True)
    return JSONResponse({"error": "La base de datos no responde. Intenta en un momento."}, 503)


@app.exception_handler(Exception)
async def error_interno(_: Request, e: Exception):
    return JSONResponse({"error": "Error interno del servidor."}, 500)


@app.get("/api/estado")
def estado():
    return {"app": "HoudiniApp"}


@app.delete("/api/cuenta", status_code=204)
async def borrar_cuenta(yo: dict = Depends(nube.sesion)):
    await run_in_threadpool(nube.borrar_usuario, yo["id"])
    await tiempo_real.desconectar(yo["usuario"])


app.include_router(nube.router, prefix="/api")
app.include_router(tiempo_real.router, prefix="/api")
app.include_router(tiempo_real.ws_router)

if __name__ == "__main__":
    # 0.0.0.0 permite que el celular entre por la red Wi-Fi.
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), ws_max_size=4096)
