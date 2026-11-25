import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Recipe, RecipeResponse } from '../core/recipe.model';

const RECIPES_CACHE_KEY = 'offline_recipes_cache';
const RECIPES_FAVORITES_KEY = 'offline_recipe_favorites';
const LAST_SYNC_KEY = 'ultimaActualizacionRecetas';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly api = 'https://dummyjson.com/recipes';

  private readonly _recipes = signal<Recipe[]>([]);
  private readonly _selectedCuisine = signal<string>('all');
  private readonly _selectedDifficulty = signal<string>('all');
  private readonly _favorites = signal<number[]>(this.readFavorites());

  readonly onlyFavorites = signal(false);
  readonly favoritesCount = computed(() => this._favorites().length);
  readonly fromCache = signal(false);

  readonly cuisines = computed(() => {
    const list = this._recipes().map((r) => r.cuisine);
    return Array.from(new Set(list)).sort();
  });

  readonly recipes = computed(() => {
    const cuisine = this._selectedCuisine();
    const diff = this._selectedDifficulty();
    const favOnly = this.onlyFavorites();
    const favs = this._favorites();

    return this._recipes().filter((r) => {
      const matchCuisine = cuisine === 'all' || r.cuisine === cuisine;
      const matchDiff = diff === 'all' || r.difficulty === diff;
      const matchFav = !favOnly || favs.includes(r.id);
      return matchCuisine && matchDiff && matchFav;
    });
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly ultimaActualizacion = signal(
    (typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null) ||
      'Sin actualizar aún'
  );

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.fromCache.set(false);

    this.http.get<RecipeResponse>(this.api).subscribe({
      next: (response) => {
        this._recipes.set(response.recipes);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(response.recipes));
        }

        const isOnline = typeof navigator === 'undefined' || navigator.onLine;
        if (isOnline) {
          const fecha = new Date().toLocaleString();
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LAST_SYNC_KEY, fecha);
          }
          this.ultimaActualizacion.set(fecha);
        } else {
          this.fromCache.set(true);
        }

        this.loading.set(false);
      },
      error: () => {
        const cached = this.readCachedRecipes();
        if (cached.length > 0) {
          this._recipes.set(cached);
          this.fromCache.set(true);
          this.error.set(null);
        } else {
          this.error.set(
            'No se pudieron cargar las recetas. Conéctate a internet al menos una vez para guardarlas en modo offline.'
          );
        }
        this.loading.set(false);
      },
    });
  }

  setCuisine(cuisine: string): void {
    this._selectedCuisine.set(cuisine);
  }

  setDifficulty(difficulty: string): void {
    this._selectedDifficulty.set(difficulty);
  }

  isFavorite(id: number): boolean {
    return this._favorites().includes(id);
  }

  toggleFavorite(id: number): void {
    const current = this._favorites();
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];

    this._favorites.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECIPES_FAVORITES_KEY, JSON.stringify(updated));
    }
  }

  toggleOnlyFavorites(): void {
    this.onlyFavorites.set(!this.onlyFavorites());
  }

  private readCachedRecipes(): Recipe[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(RECIPES_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private readFavorites(): number[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(RECIPES_FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
