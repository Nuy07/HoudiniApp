# HoudiniApp

Tu escape social inteligente a un solo toque.

- `movil/`: app en Expo (React Native). Guarda en el teléfono, con SQLite, los perfiles, reglas e historial.
- `servidor/`: API en Python (FastAPI) con base de datos en Supabase.
- `web_anterior/`: primera versión web, solo como referencia.

## Arquitectura

Las dos partes usan las mismas capas. Las de afuera conocen a las de adentro, nunca al revés.

| Capa | Qué contiene | Back (`servidor/app/`) | App (`movil/src/`) |
|---|---|---|---|
| Dominio | Entidades, reglas y contratos. Sin librerías | `dominio/` | `dominio/` |
| Servicios | Qué hace la app, en clases | `servicios/` | `servicios/` |
| Infraestructura | Base de datos, internet, sensores | `infraestructura/` | `infraestructura/` |
| Entrada | Lo que usa la persona o la app | `api/` (rutas, esquemas, errores) | `vistas/`, `estilos/`, `estado/` |
| Contenedor | Arma todas las piezas | `contenedor.py` | `contenedor.ts` |

### Back

    servidor/
      main.py               arranque
      bd/                   esquema y datos de Supabase
      app/
        dominio/            entidades, errores, contratos (puertos)
        servicios/          cuentas, sesiones, respaldos, tienda, cómplices, alertas
        infraestructura/    conexión, huellas, WebSocket y repositorios/
        api/                rutas/, esquemas, errores, dependencias
      pruebas/

### App

    movil/
      App.tsx               arranque
      src/
        dominio/            modelos, contratos (puertos) y reglas puras
        servicios/          escapes/, gatillos/, llamada/, nube/
        infraestructura/    local/ (SQLite), nube/ (API), dispositivo/ (sensores, audio)
        estado/             navegación, avisos y formulario abierto
        estilos/            tema (colores) y estilos de cada vista
        vistas/             pantallas/, capas/, componentes/, formularios/, ganchos/, navegacion/

### SOLID

- **S, una responsabilidad:** cada clase hace una cosa. `Temporizador` programa, `Narrador` habla, `TiendaPostgres` consulta.
- **O, abierto a crecer:** un escape nuevo es una clase que cumple `Escape` y se registra en el contenedor. `Lanzador` no cambia. Igual con `VALIDADORES` en el back.
- **L, sustitución:** `VocesSqlite`, `PerfilesSqlite` y demás se usan como cualquier `Coleccion`. En las pruebas, los repositorios en memoria reemplazan a los de PostgreSQL.
- **I, contratos pequeños:** `Vibrador`, `Sonidos` o `RegistroEscapes` tienen solo lo necesario.
- **D, depender de contratos:** los servicios reciben contratos en su constructor. Solo el contenedor conoce Expo, SQLite o PostgreSQL.

## API en tu computadora

    cd servidor
    pip install -r requirements.txt
    copy .env.example .env
    python main.py

Pon tu cadena de Supabase en `.env` antes de ejecutar. La base se crea con `bd/esquema.sql` y `bd/datos.sql`.

## App

    cd movil
    npm install
    npx expo start

La app usa la API en https://houdiniapp-api.onrender.com. Se puede cambiar en Configuración.

## Pruebas

    cd servidor
    python -m unittest          (servicios y capas, sin base de datos)
    cd ../movil
    npm run revisar             (tipos y capas)

`python -m pruebas.integracion` prueba la API completa. Necesita `pip install -r requirements-dev.txt` y `DATABASE_URL_PRUEBA` con una base PostgreSQL vacía.

## API en Render

New > Blueprint, elige este repositorio y escribe `DATABASE_URL` cuando la pida. Usa `render.yaml`.
