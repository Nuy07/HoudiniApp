"""HoudiniApp: servidor. Se ejecuta con: python main.py"""
import uvicorn

from app.aplicacion import crear_app
from app.configuracion import Configuracion

if __name__ == "__main__":
    configuracion = Configuracion.desde_entorno()
    # 0.0.0.0 permite que el celular entre por la red Wi-Fi.
    uvicorn.run(crear_app(configuracion), host="0.0.0.0", port=configuracion.puerto, ws_max_size=4096)
