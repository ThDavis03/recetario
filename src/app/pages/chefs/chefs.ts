import { Component, inject } from '@angular/core';
import { ChefService } from '../../services/chef.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Chef } from '../../core/chef.model';
import { applyOfflineImageFallback } from '../../core/image-fallback';

@Component({
  selector: 'app-chefs',
  imports: [],
  templateUrl: './chefs.html',
  styleUrl: './chefs.css',
})
export class Chefs {
  public readonly service = inject(ChefService);
  public readonly push = inject(PushNotificationService);

  constructor() {
    this.service.load();
  }

  reload(): void {
    this.service.load();
  }

  onImageError(event: Event): void {
    applyOfflineImageFallback(event);
  }

  greetChef(chef: Chef): void {
    this.push.notify(
      `👨‍🍳 Saludo para ${chef.firstName} ${chef.lastName}`,
      `¡Gracias por compartir tus recetas en Recetario PWA! (${chef.company?.title || 'Chef'})`
    );
  }
}
