from fastapi import APIRouter, Depends

from app.api.dependencias import Cuentas, Sesiones, Yo, limitar_direccion
from app.api.esquemas import Credenciales

router = APIRouter(tags=["Cuentas"])


@router.post("/registro", status_code=201, dependencies=[Depends(limitar_direccion)])
def registro(c: Credenciales, cuentas: Cuentas):
    return cuentas.registrar(c.usuario, c.clave)


@router.post("/login", dependencies=[Depends(limitar_direccion)])
def login(c: Credenciales, cuentas: Cuentas):
    return cuentas.entrar(c.usuario, c.clave)


@router.post("/salir", status_code=204)
def salir(yo: Yo, sesiones: Sesiones):
    sesiones.cerrar(yo.token)


@router.delete("/cuenta", status_code=204)
async def borrar(yo: Yo, cuentas: Cuentas):
    await cuentas.eliminar(yo)
