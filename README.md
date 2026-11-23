# HoudiniApp

Tu escape social inteligente a un solo toque.

- `movil/`: app en Expo (React Native). Guarda en el teléfono, con SQLite, los perfiles, reglas e historial.
- `servidor/`: API en Python (FastAPI) con base de datos en Supabase.
- `web_anterior/`: primera versión web, solo como referencia.

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

## API en Render

New > Blueprint, elige este repositorio y escribe `DATABASE_URL` cuando la pida. Usa `render.yaml`.
