// Alertas de cómplices recibidas por tiempo real.
import { Vibration } from 'react-native';
import { aviso } from './estado';
import type { Alerta, Evento } from './nube';
import { notificar } from './notificaciones';

let lista: Alerta[] = [];
let eventos = 0;
export const alertas = () => lista;
export const olvidarAlertas = () => { lista = []; };
// Sube con cada evento: la pantalla Cómplices lo usa para volver a cargar.
export const totalEventos = () => eventos;

export function recibir(m: Evento) {
  eventos++;
  if (m.tipo === 'alerta') {
    if (lista.some((a) => a.id === m.id)) return;
    lista = [m, ...lista].slice(0, 20);
    aviso(`${m.de}: ${m.mensaje}`);
    Vibration.vibrate([0, 300, 100, 300]);
    notificar(`alerta-${m.id}`, `Alerta de ${m.de}`, m.mensaje, 'alerta').catch(() => {});
  } else if (m.tipo === 'solicitud') aviso(`${m.de} quiere ser tu cómplice.`);
  else if (m.tipo === 'aceptado') aviso(`${m.de} aceptó ser tu cómplice.`);
}
