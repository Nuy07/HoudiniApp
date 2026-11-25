from fastapi import APIRouter

from app.api.dependencias import Alertas, Yo
from app.api.esquemas import Alerta

router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.post("", status_code=201)
async def enviar(a: Alerta, yo: Yo, alertas: Alertas):
    r = await alertas.enviar(yo, a.mensaje, a.lat, a.lng)
    return {"enviadas": r.enviadas, "enLinea": r.en_linea}
