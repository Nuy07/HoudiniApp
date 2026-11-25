from fastapi import APIRouter

from app.api.dependencias import Complices, Yo
from app.api.esquemas import NuevoComplice

router = APIRouter(prefix="/complices", tags=["Cómplices"])


@router.get("")
async def listar(yo: Yo, complices: Complices):
    return [{"usuario": v.usuario, "aceptado": v.aceptado, "enviada": v.enviada, "enLinea": en_linea}
            for v, en_linea in await complices.listar(yo)]


@router.post("", status_code=201)
async def pedir(n: NuevoComplice, yo: Yo, complices: Complices):
    await complices.pedir(yo, n.usuario)
    return {"mensaje": "Solicitud enviada."}


@router.post("/{usuario}/aceptar")
async def aceptar(usuario: str, yo: Yo, complices: Complices):
    await complices.aceptar(yo, usuario)
    return {"mensaje": "Cómplice agregado."}


@router.delete("/{usuario}", status_code=204)
async def quitar(usuario: str, yo: Yo, complices: Complices):
    await complices.quitar(yo, usuario)
