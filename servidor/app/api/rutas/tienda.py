from fastapi import APIRouter

from app.api.dependencias import Tienda, Yo
from app.api.esquemas import Paquete
from app.dominio.entidades import PaqueteNuevo

router = APIRouter(prefix="/marketplace", tags=["Tienda"])


@router.get("")
def buscar(tienda: Tienda, tipo: str = "", q: str = ""):
    return tienda.buscar(tipo, q)


@router.post("", status_code=201)
def publicar(p: Paquete, yo: Yo, tienda: Tienda):
    return {"id": tienda.publicar(yo, PaqueteNuevo(p.tipo, p.nombre, p.descripcion, p.contenido))}


@router.post("/{id_paquete}/descargar")
def descargar(id_paquete: int, tienda: Tienda):
    return tienda.descargar(id_paquete)


@router.delete("/{id_paquete}", status_code=204)
def retirar(id_paquete: int, yo: Yo, tienda: Tienda):
    tienda.retirar(yo, id_paquete)
