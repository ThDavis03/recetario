import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'recipes' },
  {
    path: 'recipes',
    loadComponent: () => import('./pages/recipes/recipes').then((m) => m.Recipes),
  },
  {
    path: 'chefs',
    loadComponent: () => import('./pages/chefs/chefs').then((m) => m.Chefs),
  },
  { path: '**', redirectTo: 'recipes' },
];
