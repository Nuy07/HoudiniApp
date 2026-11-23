"""Prueba completa de la API: python prueba.py
Necesita DATABASE_URL_PRUEBA: una base PostgreSQL de pruebas VACÍA, nunca la de Supabase en uso."""
import os
import sys
from pathlib import Path

url = os.environ.get("DATABASE_URL_PRUEBA", "")
if not url or "supabase" in url:
    sys.exit("Define DATABASE_URL_PRUEBA con una base de pruebas (no la de Supabase).")
os.environ["DATABASE_URL"] = url

import psycopg  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402


def preparar():
    with psycopg.connect(url, autocommit=True) as db:
        for rol in ("anon", "authenticated"):  # en Supabase ya existen
            if not db.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (rol,)).fetchone():
                db.execute(f"CREATE ROLE {rol} NOLOGIN")
        for archivo in ("esquema.sql", "datos.sql"):
            db.execute((Path(__file__).parent / "bd" / archivo).read_text("utf-8"))


def probar():
    with TestClient(main.app) as c:
        def pide(metodo, ruta, token=None, **k):
            return c.request(metodo, f"/api{ruta}", headers={"Authorization": f"Bearer {token}"} if token else {}, **k)

        def es(r, codigo):
            assert r.status_code == codigo, f"{r.request.method} {r.request.url}: {r.status_code} {r.text[:200]}"
            return r.json() if r.content else None

        # Cuentas
        ana, beto = ({"usuario": u, "clave": x * 64} for u, x in (("ana", "a"), ("beto", "b")))
        ta = es(pide("POST", "/registro", json=ana), 201)["token"]
        tb = es(pide("POST", "/registro", json=beto), 201)["token"]
        es(pide("POST", "/registro", json=ana), 409)
        es(pide("POST", "/registro", json={"usuario": "a b", "clave": "a" * 64}), 400)
        es(pide("POST", "/login", json={**ana, "clave": "f" * 64}), 401)
        es(pide("POST", "/login", json={"usuario": "nadie", "clave": "f" * 64}), 401)
        ta2 = es(pide("POST", "/login", json=ana), 200)["token"]
        es(pide("POST", "/salir", ta2), 204)
        es(pide("GET", "/respaldo", ta2), 401)
        es(pide("GET", "/nada"), 404)
        es(pide("POST", "/login", json={"usuario": "a\x00b", "clave": "a" * 64}), 400)

        # Respaldo
        es(pide("GET", "/respaldo", ta), 404)
        es(pide("PUT", "/respaldo", ta, json={"iv": "AAAA", "datos": "QUJD"}), 200)
        es(pide("PUT", "/respaldo", ta, json={"iv": "AAAA", "datos": "<x>"}), 400)
        assert es(pide("GET", "/respaldo", ta), 200)["datos"] == "QUJD"
        es(pide("GET", "/respaldo", tb), 404)
        es(pide("PUT", "/respaldo", ta, json={"iv": "AAAA", "datos": "A" * 2_000_000}), 413)

        # Tienda
        tienda = es(pide("GET", "/marketplace"), 200)
        assert {t["tipo"]: t["total"] for t in tienda["totales"]} == {"voz": 6, "perfil": 3}
        assert len(es(pide("GET", "/marketplace?tipo=voz&q=vecino"), 200)["paquetes"]) == 1
        pub = {"tipo": "voz", "nombre": "Mía", "descripcion": "x", "contenido": {"guion": ["hola"], "rate": 99}}
        assert es(pide("GET", "/marketplace?q=100%25"), 200)["paquetes"] == []
        es(pide("POST", "/marketplace", json=pub), 401)
        es(pide("POST", "/marketplace", ta, json={**pub, "nombre": "a\x00b"}), 400)
        es(pide("POST", "/marketplace", ta, json={**pub, "contenido": {"guion": []}}), 400)
        n = es(pide("POST", "/marketplace", ta, json=pub), 201)["id"]
        assert es(pide("POST", f"/marketplace/{n}/descargar"), 200)["contenido"]["rate"] == 2
        es(pide("DELETE", f"/marketplace/{n}", tb), 404)
        es(pide("DELETE", f"/marketplace/{n}", ta), 204)
        es(pide("POST", f"/marketplace/{n}/descargar"), 404)

        # Cómplices y alertas
        alerta = {"mensaje": "ayuda", "lat": 20.4, "lng": -100}
        es(pide("POST", "/alertas", ta, json=alerta), 400)
        es(pide("POST", "/alertas", ta, json={**alerta, "lat": 200}), 400)
        es(pide("POST", "/complices", ta, json={"usuario": "ana"}), 400)
        es(pide("POST", "/complices", ta, json={"usuario": "nadie"}), 404)
        with c.websocket_connect("/tiempo-real") as ws:
            ws.send_json({"tipo": "auth", "token": tb})
            assert ws.receive_json()["tipo"] == "listo"
            es(pide("POST", "/complices", ta, json={"usuario": "Beto"}), 201)
            assert ws.receive_json() == {"tipo": "solicitud", "de": "ana"}
            es(pide("POST", "/complices", tb, json={"usuario": "ana"}), 409)
            es(pide("POST", "/complices/beto/aceptar", ta), 404)  # no puede aceptarse a sí misma
            es(pide("POST", "/complices/ana/aceptar", tb), 200)
            assert es(pide("GET", "/complices", ta), 200)[0]["enLinea"] is True
            assert es(pide("POST", "/alertas", ta, json=alerta), 201) == {"enviadas": 1, "enLinea": 1}
            recibida = ws.receive_json()
            assert recibida["mensaje"] == "ayuda" and recibida["creada"] > 1_700_000_000_000
            es(pide("POST", "/alertas", ta, json=alerta), 429)
        # No se confirmó la recepción: se entrega de nuevo al reconectar, y solo hasta confirmarla.
        with c.websocket_connect("/tiempo-real") as ws:
            ws.send_json({"tipo": "auth", "token": tb})
            assert ws.receive_json()["tipo"] == "listo"
            a = ws.receive_json()
            assert a["lat"] == 20.4
            ws.send_text("no es json")
            ws.send_json({"tipo": "recibida", "id": "x"})
            ws.send_json({"tipo": "recibida", "id": a["id"]})
            es(pide("POST", "/salir", ta), 204)
        with c.websocket_connect("/tiempo-real") as ws:
            ws.send_json({"tipo": "auth", "token": tb})
            assert ws.receive_json()["tipo"] == "listo"
            ta = es(pide("POST", "/login", json=ana), 200)["token"]
            es(pide("DELETE", "/cuenta", ta), 204)
            assert es(pide("GET", "/complices", tb), 200) == []
        with c.websocket_connect("/tiempo-real") as ws:
            ws.send_json({"tipo": "auth", "token": "malo"})
            assert ws.receive()["code"] == 4001
    print("Todo correcto.")


if __name__ == "__main__":
    preparar()
    probar()
