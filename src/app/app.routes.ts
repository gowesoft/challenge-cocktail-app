import { Routes } from '@angular/router';
import { CocktailListComponent } from '@app/components/cocktail-list/cocktail-list.component';
import { CocktailDetailComponent } from '@app/components/cocktail-detail/cocktail-detail.component';

export const routes: Routes = [
  { path: '', component: CocktailListComponent },
  { path: 'cocktail/:id', component: CocktailDetailComponent },
  { path: '**', redirectTo: '' },
];
