// Notificaciones locales del sistema. Funcionan aunque la app esté en segundo plano.
import * as N from 'expo-notifications';
import { Platform } from 'react-native';
import type { Aviso, Notificaciones } from '../../dominio/puertos';

const CANAL = 'urgente';

export class NotificacionesExpo implements Notificaciones {
  async iniciar() {
    // Con la app abierta, la bomba y el escape programado ya se ven dentro de la app.
    N.setNotificationHandler({
      handleNotification: async ({ request }) => {
        const mostrar = request.content.data?.tipo === 'alerta';
        return { shouldShowBanner: mostrar, shouldShowList: mostrar, shouldPlaySound: mostrar, shouldSetBadge: false };
      },
    });
    if (Platform.OS !== 'android') return;
    await N.setNotificationChannelAsync(CANAL, {
      name: 'Escapes y alertas',
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 150, 300],
      lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
    });
  }

  async permiso(pedir: boolean) {
    const actual = await N.getPermissionsAsync();
    if (actual.granted || !pedir || !actual.canAskAgain) return actual.granted;
    return (await N.requestPermissionsAsync()).granted;
  }

  async mostrar({ id, titulo, texto, tipo, segundos = 0 }: Aviso) {
    if (!(await this.permiso(false))) return;
    await N.scheduleNotificationAsync({
      identifier: id,
      content: { title: titulo, body: texto, sound: true, data: { tipo }, priority: N.AndroidNotificationPriority.MAX },
      trigger: segundos > 0
        ? { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: segundos, channelId: CANAL }
        : { channelId: CANAL },
    });
  }

  cancelar(id: string) {
    N.cancelScheduledNotificationAsync(id).catch(() => {});
    N.dismissNotificationAsync(id).catch(() => {});
  }

  // Avisa cuando el usuario toca una notificación, incluso si eso fue lo que abrió la app.
  alTocar(fn: (tipo: string) => void) {
    const atender = (r: N.NotificationResponse) => {
      N.clearLastNotificationResponse();
      fn(String(r.notification.request.content.data?.tipo ?? ''));
    };
    const inicial = N.getLastNotificationResponse();
    if (inicial) atender(inicial);
    N.addNotificationResponseReceivedListener(atender);
  }
}
