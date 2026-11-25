from fastapi import FastAPI, Request

from .errores import respuesta

MAX_CUERPO = 1_500_000


async def limitar_cuerpo(request: Request, seguir):
    # Se exige el tamaño declarado para no recibir cuerpos sin límite.
    largo = request.headers.get("content-length", "0")
    if "transfer-encoding" in request.headers or not largo.isdigit() or int(largo) > MAX_CUERPO:
        return respuesta("Datos demasiado grandes.", 413)
    return await seguir(request)


def registrar_middleware(app: FastAPI) -> None:
    app.middleware("http")(limitar_cuerpo)
