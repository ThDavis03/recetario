import { Injectable, isDevMode, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly isDev = isDevMode();
  readonly swActive = signal<boolean>(
    typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      !!navigator.serviceWorker.controller
  );
  readonly syncingOffline = signal<boolean>(false);
  readonly offlineMessage = signal<string | null>(null);

  private autoSynced = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.offlineMessage.set('🟢 Conexión a internet recuperada.');
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.offlineMessage.set('📡 Sin conexión: funcionando con datos guardados en caché.');
      });
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) {
        this.markSwActiveAndSync();
      }

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.markSwActiveAndSync();
      });

      navigator.serviceWorker.ready
        .then((registration) => {
          if (navigator.serviceWorker.controller) {
            this.markSwActiveAndSync();
          } else if (registration.active && !this.autoSynced && this.isOnline()) {
            this.autoSynced = true;
            void this.syncForOffline(true);
          }
        })
        .catch(() => {
          // Service Worker no disponible en este entorno
        });
    }
  }

  private markSwActiveAndSync(): void {
    this.swActive.set(true);
    if (!this.autoSynced && this.isOnline()) {
      this.autoSynced = true;
      void this.syncForOffline(true);
    }
  }

  async syncForOffline(silent = false): Promise<void> {
    if (!this.isOnline()) {
      if (!silent) {
        this.offlineMessage.set(
          '📡 Estás sin conexión. Conéctate un momento para actualizar los datos en caché.'
        );
      }
      return;
    }

    this.syncingOffline.set(true);
    if (!silent) {
      this.offlineMessage.set('⏳ Guardando recetas y chefs para usar sin internet...');
    }

    try {
      const [recipesRes, chefsRes] = await Promise.all([
        fetch('https://dummyjson.com/recipes'),
        fetch('https://dummyjson.com/users?limit=12'),
      ]);

      if (!recipesRes.ok || !chefsRes.ok) {
        throw new Error('Error al descargar datos para modo offline');
      }

      const [recipesData, chefsData] = await Promise.all([recipesRes.json(), chefsRes.json()]);

      if (typeof localStorage !== 'undefined') {
        if (Array.isArray(recipesData?.recipes)) {
          localStorage.setItem('offline_recipes_cache', JSON.stringify(recipesData.recipes));
        }
        if (Array.isArray(chefsData?.users)) {
          localStorage.setItem('offline_chefs_cache', JSON.stringify(chefsData.users));
        }
        localStorage.setItem('ultimaActualizacionRecetas', new Date().toLocaleString());
      }

      if (!silent) {
        this.offlineMessage.set(
          '✅ Recetas y Chefs guardados en caché. ¡Ya puedes apagar el internet y probar el Modo Offline!'
        );
      }
    } catch {
      if (!silent) {
        this.offlineMessage.set('⚠️ No se pudieron sincronizar los datos en este momento.');
      }
    } finally {
      this.syncingOffline.set(false);
    }
  }
}
