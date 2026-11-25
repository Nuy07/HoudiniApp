from fastapi import APIRouter

from app.api.dependencias import Asistente, Yo
from app.api.esquemas import Situacion

router = APIRouter(prefix="/ia", tags=["Asistente IA"])


@router.post("/plan")
def planear(s: Situacion, yo: Yo, asistente: Asistente):
    return asistente.planear(yo, s.situacion, s.evitar)
