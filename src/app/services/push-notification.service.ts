import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_PUSH_API_URL, VAPID_PUBLIC_KEY } from './push-config';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);

  readonly isSupported = this.swPush.isEnabled;
  readonly enabled = signal(false);
  readonly lastResult = signal<string | null>(null);
  readonly serverUrl = signal<string>(
    localStorage.getItem('pushServerUrl') || DEFAULT_PUSH_API_URL
  );

  constructor() {
    this.checkSubscription();

    // Escuchar mensajes push entrantes para mostrarlos o reaccionar en la app
    if (this.swPush.isEnabled) {
      this.swPush.messages.subscribe((msg: any) => {
        console.log('Push recibido en el cliente:', msg);
        const title = msg?.notification?.title || msg?.title || 'Recetario PWA';
        const body = msg?.notification?.body || msg?.body || 'Nueva recomendación disponible';
        this.lastResult.set(`🔔 Notificación recibida: "${title} - ${body}"`);

        // Si el payload no traía el objeto "notification" que ngsw-worker requiere,
        // disparamos la notificación nativa desde el registro del Service Worker como respaldo
        if (!msg?.notification && 'Notification' in window && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
            });
          });
        }
      });
    }
  }

  setServerUrl(url: string): void {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.serverUrl.set(cleanUrl);
    localStorage.setItem('pushServerUrl', cleanUrl);
    this.lastResult.set(`Servidor actualizado a: ${cleanUrl}`);
  }

  async subscribe(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.lastResult.set(
        '📡 Modo Offline: conéctate a internet para activar o enviar notificaciones Push.'
      );
      return;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: VAPID_PUBLIC_KEY,
      });

      await firstValueFrom(this.http.post(`${this.serverUrl()}/subscribe`, subscription));
      this.enabled.set(true);
      this.lastResult.set('✅ Suscripción activa. ¡Recibirás alertas de recetas!');
    } catch (error) {
      console.error('Error al suscribirse a notificaciones', error);
      this.lastResult.set(
        '❌ No se pudo suscribir. Revisa permisos del navegador y que el servidor Push esté encendido.'
      );
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();
      this.enabled.set(false);
      this.lastResult.set('🔕 Suscripción cancelada.');
    } catch (error) {
      console.error('Error al cancelar suscripción', error);
    }
  }

  async notify(title: string, body: string): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.lastResult.set(
        '📡 Modo Offline: conéctate a internet para activar o enviar notificaciones Push.'
      );
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<{ enviadas: number }>(`${this.serverUrl()}/push`, {
          title,
          body,
          notification: {
            title,
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          },
        })
      );
      this.lastResult.set(
        `🚀 Alerta enviada con éxito a ${response.enviadas} dispositivo(s) suscrito(s).`
      );
    } catch {
      this.lastResult.set(
        '❌ No se pudo enviar la notificación. Verifica que el servidor Push esté activo.'
      );
    }
  }

  private async checkSubscription(): Promise<void> {
    if (!this.isSupported) {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.enabled.set(!!subscription);
    } catch (e) {
      console.warn('No se pudo verificar la suscripción', e);
    }
  }
}
