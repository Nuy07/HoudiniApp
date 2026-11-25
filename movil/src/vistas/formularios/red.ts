// Formularios de cuenta y cómplices.
import type { Contenedor } from '../../contenedor';
import type { ModoAcceso } from '../../dominio/modelos';

export function acceder({ formularios, cuenta }: Contenedor, modo: ModoAcceso) {
  const nuevo = modo === 'registro';
  formularios.abrir(nuevo ? 'Crear cuenta' : 'Iniciar sesión', [
    { id: 'usuario', label: 'Usuario', max: 20 },
    { id: 'clave', label: nuevo ? 'Contraseña (8 o más, no se puede recuperar)' : 'Contraseña', tipo: 'clave' },
  ], (v) => cuenta.entrar(modo, v.usuario, v.clave));
}

export function agregarComplice({ formularios, complices, avisos }: Contenedor, alTerminar: () => void) {
  formularios.abrir('Agregar cómplice', [{ id: 'usuario', label: 'Usuario', max: 20 }], async (v) => {
    avisos.mostrar(await complices.pedir(v.usuario));
    alTerminar();
  });
}

export function pedirAyuda({ formularios, alertas, avisos }: Contenedor) {
  formularios.abrir('Avisar a cómplices', [
    { id: 'mensaje', label: 'Mensaje', valor: 'Necesito que me rescates. Márcame.', max: 200 },
    { id: 'gps', label: 'Incluir mi ubicación', tipo: 'si' },
  ], async (v) => {
    const r = await alertas.enviar(v.mensaje, v.gps === '1');
    avisos.mostrar(`Alerta enviada a ${r.enviadas} (${r.enLinea} en línea).`);
  });
}
