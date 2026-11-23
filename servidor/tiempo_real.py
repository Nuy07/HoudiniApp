"""TIEMPO REAL: red de cómplices y alertas instantáneas por WebSocket.
Si el cómplice está desconectado, la alerta se guarda y se entrega al volver."""
import asyncio
import json
import time

import psycopg
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool as en_hilo
from psycopg.errors import UniqueViolation
from psycopg_pool import PoolTimeout
from pydantic import BaseModel, Field

import nube
from base import abrir

router = APIRouter()
ws_router = APIRouter()
conexiones: dict[str, set[WebSocket]] = {}

# La hora viaja a la app en milisegundos.
MILISEGUNDOS = "(extract(epoch FROM creada) * 1000)::bigint AS creada"


async def enviar(usuario: str, mensaje: dict):
    for ws in list(conexiones.get(usuario, ())):
        try:
            await ws.send_json(mensaje)
        except (RuntimeError, WebSocketDisconnect):
            pass  # se cerró justo ahora: la alerta queda pendiente en la base


def conectado(usuario: str) -> bool:
    return bool(conexiones.get(usuario))


# ---------- Consultas (corren en otro hilo para no frenar los WebSocket) ----------
def _lista(yo: int):
    with abrir() as db:
        return db.execute(
            """SELECT u.id, u.usuario, c.aceptado, c.solicitante_id = %(yo)s AS enviada
               FROM complices c
               JOIN usuarios u ON u.id = CASE WHEN c.solicitante_id = %(yo)s THEN c.destinatario_id ELSE c.solicitante_id END
               WHERE c.solicitante_id = %(yo)s OR c.destinatario_id = %(yo)s
               ORDER BY c.aceptado DESC, u.usuario""", {"yo": yo}).fetchall()


def _pedir(yo: int, otro: str):
    with abrir() as db:
        u = db.execute("SELECT id FROM usuarios WHERE usuario = %s", (otro,)).fetchone()
        if not u:
            raise HTTPException(404, "Ese usuario no existe.")
        try:
            db.execute("INSERT INTO complices (solicitante_id, destinatario_id) VALUES (%s, %s)", (yo, u["id"]))
        except UniqueViolation:  # el índice complices_pareja cubre ambos sentidos
            raise HTTPException(409, "Ya hay una solicitud o vínculo.")


def _aceptar(yo: int, otro: str) -> int:
    with abrir() as db:
        return db.execute(
            """UPDATE complices c SET aceptado = true FROM usuarios u
               WHERE u.usuario = %s AND c.solicitante_id = u.id AND c.destinatario_id = %s AND NOT c.aceptado""",
            (otro, yo)).rowcount


def _quitar(yo: int, otro: str):
    with abrir() as db:
        db.execute(
            """DELETE FROM complices c USING usuarios u WHERE u.usuario = %(otro)s
               AND ((c.solicitante_id = %(yo)s AND c.destinatario_id = u.id)
                 OR (c.solicitante_id = u.id AND c.destinatario_id = %(yo)s))""", {"yo": yo, "otro": otro})


def _guardar_alertas(yo: int, mensaje: str, lat, lng):
    """Crea una alerta por cada cómplice aceptado y devuelve a quién va cada una."""
    with abrir() as db:
        # Privacidad: las alertas (pueden llevar ubicación) se borran a los 7 días.
        db.execute("DELETE FROM alertas WHERE creada < now() - interval '7 days'")
        return db.execute(
            f"""WITH nuevas AS (
                  INSERT INTO alertas (de_id, para_id, mensaje, lat, lng)
                  SELECT %(yo)s, CASE WHEN solicitante_id = %(yo)s THEN destinatario_id ELSE solicitante_id END,
                         %(mensaje)s, %(lat)s, %(lng)s
                  FROM complices WHERE aceptado AND (solicitante_id = %(yo)s OR destinatario_id = %(yo)s)
                  RETURNING id, para_id, creada)
                SELECT n.id, u.usuario AS para, {MILISEGUNDOS} FROM nuevas n JOIN usuarios u ON u.id = n.para_id""",
            {"yo": yo, "mensaje": mensaje, "lat": lat, "lng": lng}).fetchall()


def _pendientes(yo: int):
    with abrir() as db:
        return db.execute(
            f"""SELECT a.id, u.usuario AS de, a.mensaje, a.lat, a.lng, {MILISEGUNDOS}
                FROM alertas a JOIN usuarios u ON u.id = a.de_id
                WHERE a.para_id = %s AND NOT a.entregada ORDER BY a.id""", (yo,)).fetchall()


def _recibida(yo: int, id_alerta: int):
    with abrir() as db:
        db.execute("UPDATE alertas SET entregada = true WHERE id = %s AND para_id = %s", (id_alerta, yo))


# ---------- Cómplices ----------
class Nuevo(BaseModel):
    usuario: str = Field(max_length=60)


@router.get("/complices")
async def complices(yo: dict = Depends(nube.sesion)):
    return [{
        "usuario": c["usuario"], "aceptado": c["aceptado"], "enviada": c["enviada"],
        # El estado en línea solo se comparte si ambos aceptaron.
        "enLinea": c["aceptado"] and conectado(c["usuario"]),
    } for c in await en_hilo(_lista, yo["id"])]


@router.post("/complices", status_code=201)
async def pedir(n: Nuevo, yo: dict = Depends(nube.sesion)):
    otro = n.usuario.strip().lower()
    if otro == yo["usuario"]:
        raise HTTPException(400, "No puedes agregarte a ti.")
    await en_hilo(_pedir, yo["id"], otro)
    await enviar(otro, {"tipo": "solicitud", "de": yo["usuario"]})
    return {"mensaje": "Solicitud enviada."}


@router.post("/complices/{usuario}/aceptar")
async def aceptar(usuario: str, yo: dict = Depends(nube.sesion)):
    if not await en_hilo(_aceptar, yo["id"], usuario):
        raise HTTPException(404, "No hay solicitud.")
    await enviar(usuario, {"tipo": "aceptado", "de": yo["usuario"]})
    return {"mensaje": "Cómplice agregado."}


@router.delete("/complices/{usuario}", status_code=204)
async def quitar(usuario: str, yo: dict = Depends(nube.sesion)):
    await en_hilo(_quitar, yo["id"], usuario)


# ---------- Alertas ----------
class Alerta(BaseModel):
    mensaje: str = Field(max_length=1000)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)


_ultima: dict[int, float] = {}


@router.post("/alertas", status_code=201)
async def alertar(a: Alerta, yo: dict = Depends(nube.sesion)):
    mensaje = a.mensaje.strip()[:200]
    if not mensaje:
        raise HTTPException(400, "Escribe un mensaje.")
    if time.time() - _ultima.get(yo["id"], 0) < 3:
        raise HTTPException(429, "Espera unos segundos.")
    _ultima[yo["id"]] = time.time()
    lat, lng = (a.lat, a.lng) if a.lat is not None and a.lng is not None else (None, None)
    try:
        nuevas = await en_hilo(_guardar_alertas, yo["id"], mensaje, lat, lng)
    except Exception:
        _ultima.pop(yo["id"], None)  # si no se pudo guardar, se puede reintentar enseguida
        raise
    if not nuevas:
        _ultima.pop(yo["id"], None)
        raise HTTPException(400, "Aún no tienes cómplices aceptados.")
    for n in nuevas:
        await enviar(n["para"], {"tipo": "alerta", "id": n["id"], "de": yo["usuario"], "mensaje": mensaje,
                                 "lat": lat, "lng": lng, "creada": n["creada"]})
    return {"enviadas": len(nuevas), "enLinea": sum(conectado(n["para"]) for n in nuevas)}


# ---------- WebSocket ----------
@ws_router.websocket("/tiempo-real")
async def tiempo_real(ws: WebSocket):
    await ws.accept()
    yo = None
    try:
        # El primer mensaje debe traer el token, y hay 5 segundos para mandarlo.
        try:
            m = json.loads(await asyncio.wait_for(ws.receive_text(), 5))
            if isinstance(m, dict) and m.get("tipo") == "auth":
                yo = await en_hilo(nube.por_token, m.get("token"))
        except (asyncio.TimeoutError, ValueError):
            pass
        if not yo:
            await ws.close(4001)
            return
        conexiones.setdefault(yo["usuario"], set()).add(ws)
        await ws.send_json({"tipo": "listo"})
        for p in await en_hilo(_pendientes, yo["id"]):
            await ws.send_json({"tipo": "alerta", **p})
        while True:
            try:
                m = json.loads(await ws.receive_text())
            except ValueError:
                continue
            id_alerta = m.get("id") if isinstance(m, dict) and m.get("tipo") == "recibida" else None
            if isinstance(id_alerta, int) and not isinstance(id_alerta, bool) and 0 < id_alerta < 2**63:
                await en_hilo(_recibida, yo["id"], id_alerta)
    except (psycopg.OperationalError, PoolTimeout):
        # La base no respondió: la app reconecta sola y vuelve a recibir lo pendiente.
        try:
            await ws.close(1013)
        except RuntimeError:
            pass
    except (WebSocketDisconnect, RuntimeError, KeyError):
        pass  # KeyError: llegó un mensaje binario
    finally:
        if yo:
            grupo = conexiones.get(yo["usuario"], set())
            grupo.discard(ws)
            if not grupo:
                conexiones.pop(yo["usuario"], None)


async def desconectar(usuario: str):
    for ws in list(conexiones.get(usuario, ())):
        try:
            await ws.close(4001)
        except RuntimeError:
            pass
