import type { Contenedor } from '../../contenedor';

export async function probarServidor({ api, avisos }: Contenedor) {
  await api.probar();
  avisos.mostrar('Conectado con el servidor.');
}

export function editarServidor(app: Contenedor) {
  app.formularios.abrir('Servidor', [
    { id: 'url', label: 'Dirección de la API de Python', valor: app.servidor.url, ayuda: 'https://mi-api.onrender.com', max: 120 },
  ], (v) => {
    app.servidor.cambiar(v.url);
    return probarServidor(app);
  });
}
