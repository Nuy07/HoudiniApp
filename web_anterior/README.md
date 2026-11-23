# HoudiniApp

Tu escape social inteligente a un solo toque. PWA con servidor Node.

## Ejecutar

1. `npm install` (solo la primera vez)
2. En VS Code presiona **F5**, o en la terminal: `npm start`
3. Abre http://localhost:4000

## Triple base de datos

| Base | Dónde vive | Para qué | Archivo |
|---|---|---|---|
| SQLite local | En el teléfono (sql.js, cifrada con AES-GCM) | Perfiles, reglas GPS, historial. Sin internet | `public/js/db.js` |
| Nube | `datos/nube.db` | Cuentas, respaldo cifrado, tienda | `servidor/nube.js` |
| Tiempo real | `datos/tiempo_real.db` + WebSocket | Cómplices y alertas | `servidor/tiempo-real.js` |

## Archivos de la app

- `public/js/app.js`: pantallas
- `public/js/escape.js`: llamada falsa y bomba de notificaciones
- `public/js/gatillos.js`: teclas, agitar, modo discreto, temporizador y GPS
- `public/js/nube.js`: conexión con el servidor
- `public/sw.js`: funcionamiento sin internet

## Probar en el celular

GPS, sensores y cifrado exigen HTTPS. En VS Code: panel **Puertos** > **Reenviar un puerto** > `4000`,
y abre en el celular la dirección https que aparece.

## Límites de una app web

- Los botones de volumen funcionan en computadora (o tecla V, 3 veces). En el celular el navegador
  no los entrega a la página: usa agitar o rescate discreto.
- El sensor de proximidad no está disponible: se usa la inclinación del teléfono.
- GPS, temporizador y gatillos necesitan la app abierta.
