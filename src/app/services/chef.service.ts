import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Chef, ChefResponse } from '../core/chef.model';

const CHEFS_CACHE_KEY = 'offline_chefs_cache';

@Injectable({ providedIn: 'root' })
export class ChefService {
  private readonly http = inject(HttpClient);
  private readonly api = 'https://dummyjson.com/users?limit=12';

  private readonly _chefs = signal<Chef[]>([]);
  readonly chefs = this._chefs.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly fromCache = signal(false);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.fromCache.set(false);

    this.http.get<ChefResponse>(this.api).subscribe({
      next: (res) => {
        this._chefs.set(res.users);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(CHEFS_CACHE_KEY, JSON.stringify(res.users));
        }
        this.fromCache.set(typeof navigator !== 'undefined' && !navigator.onLine);
        this.loading.set(false);
      },
      error: () => {
        const cached = this.readCachedChefs();
        if (cached.length > 0) {
          this._chefs.set(cached);
          this.fromCache.set(true);
          this.error.set(null);
        } else {
          this.error.set(
            'No se pudieron cargar los chefs. Conéctate a internet al menos una vez para guardarlos en modo offline.'
          );
        }
        this.loading.set(false);
      },
    });
  }

  private readCachedChefs(): Chef[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(CHEFS_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
