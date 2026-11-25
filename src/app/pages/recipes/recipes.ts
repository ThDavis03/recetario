import { Component, inject, signal } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Recipe } from '../../core/recipe.model';
import { applyOfflineImageFallback } from '../../core/image-fallback';

@Component({
  selector: 'app-recipes',
  imports: [],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
})
export class Recipes {
  public readonly service = inject(RecipeService);
  public readonly push = inject(PushNotificationService);
  public readonly selectedRecipe = signal<Recipe | null>(null);

  constructor() {
    this.service.load();
  }

  reload(): void {
    this.service.load();
  }

  onCuisineChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.service.setCuisine(select.value);
  }

  onDifficultyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.service.setDifficulty(select.value);
  }

  openDetail(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
  }

  closeDetail(): void {
    this.selectedRecipe.set(null);
  }

  onImageError(event: Event): void {
    applyOfflineImageFallback(event);
  }

  recommendRecipe(recipe: Recipe): void {
    this.push.notify(
      `🍳 Receta Recomendada: ${recipe.name}`,
      `Cocina ${recipe.cuisine} • Lista en ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min (${recipe.caloriesPerServing} kcal)`
    );
  }
}
