"""NUBE: cuentas, respaldo cifrado de perfiles y tienda de la comunidad."""
import hashlib
import hmac
import math
import os
import re
import secrets
import time

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from psycopg.errors import UniqueViolation
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

from base import abrir, limpio

DIAS_SESION = 30
router = APIRouter()


# ---------- Sesiones ----------
def _sha256(texto: str) -> str:
    return hashlib.sha256(texto.encode()).hexdigest()


def _scrypt(clave: str, sal: str) -> bytes:
    return hashlib.scrypt(clave.encode(), salt=sal.encode(), n=2**14, r=8, p=1, dklen=32)


def por_token(token):
    """Usuario dueño del token, o None si no es válido o ya venció."""
    if not isinstance(token, str) or not token:
        return None
    with abrir() as db:
        return db.execute(
            """SELECT u.id, u.usuario FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
               WHERE s.token_hash = %s AND s.expira > now()""", (_sha256(token),)).fetchone()


def sesion(authorization: str = Header(default="")):
    """Dependencia: exige "Authorization: Bearer <token>"."""
    token = authorization.removeprefix("Bearer ")
    usuario = por_token(token)
    if not usuario:
        raise HTTPException(401, "Inicia sesión primero.")
    return {**usuario, "token": token}


def borrar_usuario(id_usuario: int):
    # Sesiones, respaldo, publicaciones, cómplices y alertas se borran en cascada.
    with abrir() as db:
        db.execute("DELETE FROM usuarios WHERE id = %s", (id_usuario,))


def _abrir_sesion(db, id_usuario: int) -> str:
    db.execute("DELETE FROM sesiones WHERE expira < now()")
    token = secrets.token_hex(32)
    db.execute(
        """INSERT INTO sesiones (token_hash, usuario_id, expira)
           VALUES (%s, %s, now() + make_interval(days => %s))""", (_sha256(token), id_usuario, DIAS_SESION))
    return token


# Freno a quien prueba contraseñas: 20 intentos por dirección y 60 por usuario cada 10 minutos.
_intentos: dict[str, tuple[int, float]] = {}


def _contar(clave: str, maximo: int):
    ahora = time.time()
    if len(_intentos) > 5000:
        _intentos.clear()
    n, hasta = _intentos.get(clave, (0, 0))
    if hasta <= ahora:
        n, hasta = 0, ahora + 600
    _intentos[clave] = (n + 1, hasta)
    if n + 1 > maximo:
        raise HTTPException(429, "Demasiados intentos. Espera unos minutos.")


def limitar(request: Request):
    ip = request.client.host if request.client else "?"
    if os.environ.get("RENDER"):  # detrás del proxy de Render, la dirección real viene en esta cabecera
        ip = request.headers.get("cf-connecting-ip", ip)
    _contar(f"ip {ip}", 20)


# ---------- Cuentas ----------
class Credenciales(BaseModel):
    # La app nunca manda la contraseña: manda una clave derivada (64 hex).
    usuario: str = Field(max_length=60)
    clave: str = Field(pattern=r"^[0-9a-f]{64}$")


@router.post("/registro", status_code=201, dependencies=[Depends(limitar)])
def registro(c: Credenciales):
    usuario = c.usuario.strip().lower()
    if not re.fullmatch(r"[a-z0-9_]{3,20}", usuario):
        raise HTTPException(400, "Usuario de 3 a 20 letras, números o guion bajo.")
    sal = secrets.token_hex(16)
    huella = _scrypt(c.clave, sal).hex()
    with abrir() as db:
        try:
            nuevo = db.execute("INSERT INTO usuarios (usuario, sal, hash) VALUES (%s, %s, %s) RETURNING id",
                               (usuario, sal, huella)).fetchone()
        except UniqueViolation:
            raise HTTPException(409, "Ese usuario ya existe.")
        return {"usuario": usuario, "token": _abrir_sesion(db, nuevo["id"])}


@router.post("/login", dependencies=[Depends(limitar)])
def login(c: Credenciales):
    usuario = c.usuario.strip().lower()
    _contar(f"usuario {usuario}", 60)
    with abrir() as db:
        u = db.execute("SELECT id, usuario, sal, hash FROM usuarios WHERE usuario = %s", (usuario,)).fetchone()
    # Si no existe se calcula igual, para no revelar qué usuarios hay.
    huella = _scrypt(c.clave, u["sal"] if u else "x")
    if not u or not hmac.compare_digest(huella, bytes.fromhex(u["hash"])):
        raise HTTPException(401, "Usuario o contraseña incorrectos.")
    with abrir() as db:
        return {"usuario": u["usuario"], "token": _abrir_sesion(db, u["id"])}


@router.post("/salir", status_code=204)
def salir(yo: dict = Depends(sesion)):
    with abrir() as db:
        db.execute("DELETE FROM sesiones WHERE token_hash = %s", (_sha256(yo["token"]),))


# ---------- Respaldo (llega ya cifrado desde el teléfono) ----------
class Respaldo(BaseModel):
    iv: str = Field(max_length=32, pattern=r"^[A-Za-z0-9+/]+=*$")
    datos: str = Field(max_length=1_000_000, pattern=r"^[A-Za-z0-9+/]+=*$")


@router.get("/respaldo")
def leer_respaldo(yo: dict = Depends(sesion)):
    with abrir() as db:
        fila = db.execute("SELECT iv, datos, actualizado FROM respaldos WHERE usuario_id = %s", (yo["id"],)).fetchone()
    if not fila:
        raise HTTPException(404, "Aún no tienes respaldo en la nube.")
    return fila


@router.put("/respaldo")
def guardar_respaldo(r: Respaldo, yo: dict = Depends(sesion)):
    with abrir() as db:
        db.execute(
            """INSERT INTO respaldos (usuario_id, iv, datos) VALUES (%s, %s, %s)
               ON CONFLICT (usuario_id) DO UPDATE SET iv = excluded.iv, datos = excluded.datos,
               actualizado = now()""", (yo["id"], r.iv, r.datos))
    return {"mensaje": "Respaldo guardado."}


# ---------- Tienda ----------
# El contenido público se valida campo por campo antes de guardarlo.
def _numero(n) -> float:
    valido = isinstance(n, (int, float)) and not isinstance(n, bool) and math.isfinite(n)
    return min(2, max(0.5, n)) if valido else 1


def _limpiar_voz(v):
    if not isinstance(v, dict) or not isinstance(v.get("guion"), list):
        return None
    guion = [t for t in (limpio(x, 200) for x in v["guion"][:20]) if t]
    if not guion:
        return None
    return {"nombre": limpio(v.get("nombre"), 60) or "Voz", "rate": _numero(v.get("rate")),
            "pitch": _numero(v.get("pitch")), "guion": guion}


def _limpiar_contenido(tipo, c):
    if tipo == "voz":
        return _limpiar_voz(c)
    if tipo != "perfil":
        return None
    nombre, voz = limpio(c.get("nombre"), 60), _limpiar_voz(c.get("voz"))
    if not nombre or not voz:
        return None
    return {"nombre": nombre, "etiqueta": limpio(c.get("etiqueta"), 40) or "Móvil", "voz": voz}


class Paquete(BaseModel):
    tipo: str
    nombre: str
    descripcion: str
    contenido: dict


@router.get("/marketplace")
def tienda(tipo: str = "", q: str = ""):
    tipo = tipo if tipo in ("perfil", "voz") else ""
    with abrir() as db:
        paquetes = db.execute(
            """SELECT m.id, m.tipo, m.nombre, m.descripcion, m.descargas,
                 COALESCE(u.usuario, 'HoudiniApp') AS autor
               FROM marketplace m LEFT JOIN usuarios u ON u.id = m.autor_id
               WHERE (%(tipo)s = '' OR m.tipo = %(tipo)s)
                 AND (strpos(lower(m.nombre), lower(%(q)s)) > 0 OR strpos(lower(m.descripcion), lower(%(q)s)) > 0)
               ORDER BY m.descargas DESC, m.id LIMIT 100""", {"tipo": tipo, "q": q[:60]}).fetchall()
        totales = db.execute("SELECT tipo, COUNT(*) AS total FROM marketplace GROUP BY tipo").fetchall()
    return {"paquetes": paquetes, "totales": totales}


@router.post("/marketplace", status_code=201)
def publicar(p: Paquete, yo: dict = Depends(sesion)):
    nombre, descripcion = limpio(p.nombre, 60), limpio(p.descripcion, 160)
    contenido = _limpiar_contenido(p.tipo, p.contenido)
    if not (nombre and descripcion and contenido):
        raise HTTPException(400, "Paquete incompleto.")
    with abrir() as db:
        return db.execute(
            """INSERT INTO marketplace (tipo, nombre, descripcion, contenido, autor_id)
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (p.tipo, nombre, descripcion, Jsonb(contenido), yo["id"])).fetchone()


@router.post("/marketplace/{id_paquete}/descargar")
def descargar(id_paquete: int):
    if not 0 < id_paquete < 2**63:
        raise HTTPException(404, "Paquete no encontrado.")
    with abrir() as db:
        p = db.execute(
            "UPDATE marketplace SET descargas = descargas + 1 WHERE id = %s RETURNING tipo, nombre, contenido",
            (id_paquete,)).fetchone()
    if not p:
        raise HTTPException(404, "Paquete no encontrado.")
    return p


@router.delete("/marketplace/{id_paquete}", status_code=204)
def retirar(id_paquete: int, yo: dict = Depends(sesion)):
    if not 0 < id_paquete < 2**63:
        raise HTTPException(404, "No es un paquete tuyo.")
    with abrir() as db:
        borrado = db.execute("DELETE FROM marketplace WHERE id = %s AND autor_id = %s", (id_paquete, yo["id"])).rowcount
    if not borrado:
        raise HTTPException(404, "No es un paquete tuyo.")
