import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Cocktail, Ingredient } from '../../models/cocktail.model';
import { CocktailApiService } from '../../services/cocktail-api.service';
import { FavoritesService } from '../../services/favorites.service';
import { CocktailUtils } from '../../utils/cocktail.utils';

@Component({
  selector: 'app-cocktail-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatListModule,
    MatDividerModule,
    MatToolbarModule,
  ],
  templateUrl: './cocktail-detail.component.html',
  styleUrls: ['./cocktail-detail.component.scss'],
})
export class CocktailDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cocktail = signal<Cocktail | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  imageLoaded = signal<boolean>(false);
  contentReady = signal<boolean>(false); // Control when to show content with animation

  ingredients = computed(() => {
    const c = this.cocktail();
    return c ? CocktailUtils.extractIngredients(c) : [];
  });

  instructions = computed(() => {
    const c = this.cocktail();
    return c ? CocktailUtils.getInstructions(c) : '';
  });

  tags = computed(() => {
    const c = this.cocktail();
    if (!c || !c.strTags) return [];
    return c.strTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  });

  isFavorite = computed(() => {
    const c = this.cocktail();
    return c ? this.favoritesService.isFavorite(c.idDrink) : false;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cocktailApiService: CocktailApiService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    // Scroll to top when entering detail view for smooth experience
    window.scrollTo(0, 0);

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadCocktailDetails(id);
      } else {
        this.error.set('No cocktail ID provided');
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCocktailDetails(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.imageLoaded.set(false); // Reset image state
    this.contentReady.set(false); // Reset content ready state

    this.cocktailApiService
      .getCocktailDetails(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cocktail) => {
          if (cocktail) {
            this.cocktail.set(cocktail);

            // Start fade-out of skeleton immediately
            this.isLoading.set(false);

            // Fade-in content after a brief moment to ensure smooth cross-fade
            setTimeout(() => {
              this.contentReady.set(true);
            }, 150);
          } else {
            this.error.set('Cocktail not found');
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.error.set('Failed to load cocktail details');
          this.isLoading.set(false);
        },
      });
  }

  onImageLoad(event: Event): void {
    this.imageLoaded.set(true);
  }

  toggleFavorite(): void {
    const c = this.cocktail();
    if (c) {
      this.favoritesService.toggleFavorite(c.idDrink);
    }
  }

  goBack(): void {
    // Use Location.back() instead of router.navigate to properly restore state
    this.location.back();
  }
}
