import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PushNotificationService } from './services/push-notification.service';
import { NetworkStatusService } from './services/network-status.service';
import { CLOUD_PUSH_API_URL, DEFAULT_PUSH_API_URL } from './services/push-config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public readonly push = inject(PushNotificationService);
  public readonly network = inject(NetworkStatusService);
  public readonly localUrl = DEFAULT_PUSH_API_URL;
  public readonly cloudUrl = CLOUD_PUSH_API_URL;

  async toggleNotifications(): Promise<void> {
    if (this.push.enabled()) {
      await this.push.unsubscribe();
    } else {
      await this.push.subscribe();
    }
  }

  testNotification(): void {
    this.push.notify(
      '🍳 ¡Hora de cocinar!',
      'Esta es una alerta de prueba de tu Recetario PWA en Angular.'
    );
  }

  onServerChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.push.setServerUrl(select.value);
  }
}
