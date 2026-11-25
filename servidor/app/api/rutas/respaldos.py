from fastapi import APIRouter

from app.api.dependencias import Respaldos, Yo
from app.api.esquemas import RespaldoCifrado

router = APIRouter(prefix="/respaldo", tags=["Respaldo"])


@router.get("")
def leer(yo: Yo, respaldos: Respaldos):
    return respaldos.leer(yo)


@router.put("")
def guardar(r: RespaldoCifrado, yo: Yo, respaldos: Respaldos):
    respaldos.guardar(yo, r.iv, r.datos)
    return {"mensaje": "Respaldo guardado."}
