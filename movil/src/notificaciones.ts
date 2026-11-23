// Notificaciones locales del sistema. Funcionan aunque la app esté en segundo plano.
import * as N from 'expo-notifications';
import { Platform } from 'react-native';

const CANAL = 'urgente';

// Con la app abierta, la bomba y el escape programado ya se ven dentro de la app.
N.setNotificationHandler({
  handleNotification: async ({ request }) => {
    const mostrar = request.content.data?.tipo === 'alerta';
    return { shouldShowBanner: mostrar, shouldShowList: mostrar, shouldPlaySound: mostrar, shouldSetBadge: false };
  },
});

export async function iniciar() {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CANAL, {
    name: 'Escapes y alertas',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 150, 300],
    lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function permiso(pedir: boolean) {
  const actual = await N.getPermissionsAsync();
  if (actual.granted || !pedir || !actual.canAskAgain) return actual.granted;
  return (await N.requestPermissionsAsync()).granted;
}

// segundos = 0 la muestra al instante. Si no hay permiso, no hace nada.
export async function notificar(id: string, title: string, body: string, tipo: string, segundos = 0) {
  if (!(await permiso(false))) return;
  await N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true, data: { tipo }, priority: N.AndroidNotificationPriority.MAX },
    trigger: segundos > 0
      ? { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: segundos, channelId: CANAL }
      : { channelId: CANAL },
  });
}

export function cancelar(id: string) {
  N.cancelScheduledNotificationAsync(id).catch(() => {});
  N.dismissNotificationAsync(id).catch(() => {});
}

// Avisa cuando el usuario toca una notificación, incluso si eso fue lo que abrió la app.
export function alTocar(fn: (tipo: string) => void) {
  const atender = (r: N.NotificationResponse) => {
    N.clearLastNotificationResponse();
    fn(String(r.notification.request.content.data?.tipo ?? ''));
  };
  const inicial = N.getLastNotificationResponse();
  if (inicial) atender(inicial);
  N.addNotificationResponseReceivedListener(atender);
}
