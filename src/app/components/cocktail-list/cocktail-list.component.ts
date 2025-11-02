import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Signal,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, fromEvent, debounceTime, takeUntil, forkJoin, of, filter } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { CocktailCardComponent } from '@app/components/cocktail-card/cocktail-card.component';
import { SearchBarComponent } from '@app/components/search-bar/search-bar.component';
import { CocktailSkeletonComponent } from '@app/shared/components';
import { Cocktail, SearchFilter } from '@app/models/cocktail.model';
import { CocktailApiService } from '@app/services/cocktail-api.service';
import { FavoritesService } from '@app/services/favorites.service';
import { StateService } from '@app/services/state.service';

@Component({
  selector: 'app-cocktail-list',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatTableModule,
    MatMenuModule,
    CocktailCardComponent,
    SearchBarComponent,
    CocktailSkeletonComponent,
  ],
  templateUrl: './cocktail-list.component.html',
  styleUrls: ['./cocktail-list.component.scss'],
})
export class CocktailListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchBar') searchBarComponent!: SearchBarComponent;
  @ViewChild('cocktailsGrid') cocktailsGrid!: ElementRef;
  @ViewChild('tableContainer') tableContainer?: ElementRef;

  private destroy$ = new Subject<void>();
  private loadingTimeout?: number;
  private scrollTrackingEnabled = true; // Flag to enable/disable scroll tracking
  private lastLoadedCount = 0; // Track how many cocktails were loaded last time

  // Signals
  allCocktails = signal<Cocktail[]>([]);
  displayedCocktails = computed(() => {
    const all = this.allCocktails();
    const showFavs = this.showOnlyFavorites();
    const favoriteIds = this.favoritesService.favorites();

    if (showFavs) {
      return all.filter((c) => favoriteIds.includes(c.idDrink));
    }
    return all;
  });

  isLoading = signal<boolean>(false);
  hasMore = signal<boolean>(false);
  showScrollToTop = signal<boolean>(false);
  currentSearchFilter = signal<SearchFilter | null>(null);

  showOnlyFavorites!: Signal<boolean>;
  favoritesCount!: Signal<number>;
  viewMode!: Signal<'grid' | 'table'>;

  // Table columns
  displayedColumns: string[] = ['image', 'name', 'category', 'alcoholic', 'glass', 'actions'];

  emptyMessage = computed(() => {
    if (this.showOnlyFavorites()) {
      return 'No favorites yet. Start adding cocktails to your favorites!';
    }
    if (this.currentSearchFilter()) {
      return 'No cocktails found. Try a different search.';
    }
    return 'Start searching for cocktails!';
  });

  constructor(
    private cocktailApiService: CocktailApiService,
    public favoritesService: FavoritesService,
    private stateService: StateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    // Initialize computed signals after services are injected
    this.showOnlyFavorites = this.stateService.showOnlyFavorites;
    this.favoritesCount = this.favoritesService.favoritesCount;
    this.viewMode = this.stateService.viewMode;

    // React to favorites changes
    effect(() => {
      // Trigger re-computation when favorites change
      this.favoritesService.favorites();
      this.displayedCocktails();
    });

    // React to showOnlyFavorites changes
    effect(() => {
      const showFavs = this.showOnlyFavorites();
      if (showFavs) {
        // When activating favorites view, load favorite cocktails if needed
        this.loadFavoriteCocktails();
      }
    });
  }

  ngOnInit(): void {
    // Restore state from previous session
    this.restoreState();

    // Setup scroll tracking
    this.setupScrollTracking();

    // Listen for navigation events to restore scroll when coming back
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        // If we're back at the list (root path)
        if (event.url === '/' || event.url === '') {
          this.scrollTrackingEnabled = true; // Re-enable scroll tracking
          this.attemptScrollRestore();
        }
      });

    // Check if we have cached cocktails
    const cachedCocktails = this.stateService.cachedCocktails();
    if (cachedCocktails && cachedCocktails.length > 0) {
      // Use cached data
      this.allCocktails.set(cachedCocktails);
      this.hasMore.set(this.stateService.hasMore());
    } else if (!this.currentSearchFilter()) {
      // Load initial cocktails if no cache and no search filter
      this.loadInitialCocktails();
    }
  }

  ngAfterViewInit(): void {
    // Setup infinite scroll
    this.setupInfiniteScroll();

    // Try to restore scroll on initial load
    this.attemptScrollRestore();
  }

  private attemptScrollRestore(): void {
    const savedPosition = this.stateService.scrollPosition();

    if (!savedPosition || (savedPosition.x === 0 && savedPosition.y === 0)) {
      return;
    }

    // Update lastLoadedCount to current count to prevent animations on existing items
    this.lastLoadedCount = this.displayedCocktails().length;

    // Multiple attempts with increasing delays to handle DOM rendering
    const restore = (attemptNumber: number) => {
      window.scrollTo({
        top: savedPosition.y,
        left: savedPosition.x,
        behavior: 'auto',
      });
    };

    // Execute multiple restoration attempts
    setTimeout(() => restore(1), 0);
    setTimeout(() => restore(2), 100);
    setTimeout(() => restore(3), 200);
    setTimeout(() => restore(4), 400);
    setTimeout(() => restore(5), 700);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clear any pending timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    // Save scroll position before leaving
    this.saveScrollPosition();
  }

  onSearch(filter: SearchFilter): void {
    this.currentSearchFilter.set(filter);
    this.stateService.setSearchFilter(filter);
    this.allCocktails.set([]);
    this.isLoading.set(true);

    // Clear cache when searching
    this.stateService.clearCache();

    if (filter.type === 'id') {
      this.cocktailApiService
        .searchById(filter.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result: Cocktail | null) => {
            const cocktails = result ? [result] : [];
            this.allCocktails.set(cocktails);
            this.hasMore.set(false);
            this.isLoading.set(false);
          },
          error: (error: unknown) => {
            this.isLoading.set(false);
            this.allCocktails.set([]);
          },
        });
    } else {
      const searchObservable =
        filter.type === 'name'
          ? this.cocktailApiService.searchByName(filter.value)
          : this.cocktailApiService.searchByIngredient(filter.value);

      searchObservable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (cocktails: Cocktail[]) => {
          this.allCocktails.set(cocktails);
          this.hasMore.set(false);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.allCocktails.set([]);
        },
      });
    }
  }

  toggleShowFavorites(): void {
    this.stateService.toggleShowOnlyFavorites();
  }

  private loadFavoriteCocktails(): void {
    const favoriteIds = this.favoritesService.getFavoriteIds();

    if (favoriteIds.length === 0) {
      return; // No favorites to load
    }

    // Check which favorites are not in the current list
    const currentIds = this.allCocktails().map((c) => c.idDrink);
    const missingIds = favoriteIds.filter((id) => !currentIds.includes(id));

    if (missingIds.length === 0) {
      return; // All favorites are already loaded
    }

    // Load missing favorites from API
    this.isLoading.set(true);

    // Load each missing cocktail
    const requests = missingIds.map((id) =>
      this.cocktailApiService.getCocktailDetails(id).pipe(
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
    );

    // Wait for all requests to complete
    forkJoin(requests).subscribe({
      next: (cocktails) => {
        // Filter out nulls and add to the list
        const validCocktails = cocktails.filter((c): c is Cocktail => c !== null);

        if (validCocktails.length > 0) {
          // Merge with existing cocktails, avoiding duplicates
          const existing = this.allCocktails();
          const merged = [...existing];

          validCocktails.forEach((cocktail) => {
            if (!merged.find((c) => c.idDrink === cocktail.idDrink)) {
              merged.push(cocktail);
            }
          });

          this.allCocktails.set(merged);

          // Update cache
          this.stateService.setCachedCocktails(merged);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onClearSearch(): void {
    // Clear the search filter
    this.currentSearchFilter.set(null);
    this.stateService.setSearchFilter(null);

    // Clear cache
    this.stateService.clearCache();

    // Clear current cocktails to show loading state
    this.allCocktails.set([]);

    // Set loading state
    this.isLoading.set(true);

    // Reload initial cocktails
    this.loadInitialCocktails();

    // Update the search bar component
    if (this.searchBarComponent) {
      this.searchBarComponent.setSearchFilter(null);
    }
  }

  loadInitialCocktails(): void {
    this.isLoading.set(true);
    this.cocktailApiService
      .getRandomCocktails(12)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cocktails) => {
          this.allCocktails.set(cocktails);
          this.isLoading.set(false);
          this.hasMore.set(true);

          // Cache the initial cocktails
          this.stateService.setCachedCocktails(cocktails);
          this.stateService.setHasMore(true);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private loadMoreCocktails(): void {
    if (this.isLoading() || !this.hasMore() || this.currentSearchFilter()) {
      return;
    }

    this.isLoading.set(true);

    // Store count before loading
    const countBeforeLoad = this.allCocktails().length;

    this.cocktailApiService
      .getRandomCocktails(8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCocktails) => {
          const existing = this.allCocktails();
          const existingIds = new Set(existing.map((c) => c.idDrink));
          const uniqueNew = newCocktails.filter((c) => !existingIds.has(c.idDrink));

          // Add new cocktails
          const updatedCocktails = [...existing, ...uniqueNew];
          this.allCocktails.set(updatedCocktails);

          // Update lastLoadedCount to prevent animations on old items
          this.lastLoadedCount = countBeforeLoad;

          // Update cache
          this.stateService.setCachedCocktails(updatedCocktails);
          this.stateService.setHasMore(true);

          // Keep loading indicator visible during animation
          // Last item delay (7 * 50ms) + animation duration (500ms) + small buffer (100ms)
          this.loadingTimeout = window.setTimeout(() => {
            this.isLoading.set(false);
          }, 950);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private setupInfiniteScroll(): void {
    // Scroll on window for both views
    fromEvent(window, 'scroll')
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => {
        // Check if we're near the bottom of the page
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const threshold = 400;

        if (
          scrollPosition >= documentHeight - threshold &&
          !this.isLoading() &&
          this.hasMore() &&
          !this.currentSearchFilter()
        ) {
          this.loadMoreCocktails();
        }
      });
  }

  private setupScrollTracking(): void {
    fromEvent(window, 'scroll')
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => {
        // Only track scroll if enabled
        if (!this.scrollTrackingEnabled) {
          return;
        }

        const currentY = window.scrollY;

        this.showScrollToTop.set(currentY > 300);
        this.saveScrollPosition();
      });
  }

  private saveScrollPosition(): void {
    const position = { x: window.scrollX, y: window.scrollY };
    this.stateService.setScrollPosition(position.x, position.y, true); // ← isUserScroll = true
  }

  private restoreScrollPosition(): void {
    const position = this.stateService.scrollPosition();
    if (position && (position.x > 0 || position.y > 0)) {
      // Use auto behavior for instant restoration without animation
      window.scrollTo({
        top: position.y,
        left: position.x,
        behavior: 'auto',
      });
    }
  }

  private restoreState(): void {
    const state = this.stateService.getCurrentState();
    if (state.searchFilter) {
      this.currentSearchFilter.set(state.searchFilter);
      // Trigger search with restored filter
      setTimeout(() => {
        if (this.searchBarComponent) {
          this.searchBarComponent.setSearchFilter(state.searchFilter);
          this.onSearch(state.searchFilter!);
        }
      }, 0);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  trackByCocktailId(index: number, cocktail: Cocktail): string {
    return cocktail.idDrink;
  }

  getAnimationDelay(index: number): string {
    // Only animate new items (beyond lastLoadedCount)
    if (index < this.lastLoadedCount) {
      return '0s'; // No animation for existing items
    }

    // Only animate the last batch of NEW items (last 8)
    const totalItems = this.displayedCocktails().length;
    const itemsPerBatch = 8;
    const lastBatchStart = Math.max(this.lastLoadedCount, totalItems - itemsPerBatch);

    if (index >= lastBatchStart) {
      // Calculate delay for items in the last batch
      const positionInBatch = index - lastBatchStart;
      const delay = positionInBatch * 0.05; // 50ms between each item
      return `${delay}s`;
    }

    // No delay for older items
    return '0s';
  }

  toggleViewMode(): void {
    const newMode = this.viewMode() === 'grid' ? 'table' : 'grid';
    this.stateService.setViewMode(newMode);
  }

  refreshCocktails(): void {
    // Clear cache
    this.stateService.clearCache();
    this.allCocktails.set([]);

    // Reset search filter and related UI state
    this.currentSearchFilter.set(null);
    this.stateService.setSearchFilter(null);
    if (this.searchBarComponent) {
      this.searchBarComponent.setSearchFilter(null);
    }

    // Reset scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    // Clear saved scroll position
    this.stateService.setScrollPosition(0, 0, true);

    // Load fresh cocktails without filters
    this.loadInitialCocktails();
  }

  viewDetails(cocktail: Cocktail): void {
    // FIRST: Force process any pending scroll event immediately
    // This ensures we capture the current position if user just scrolled
    this.showScrollToTop.set(window.scrollY > 300);
    this.saveScrollPosition(); // Save whatever the current position is (with isUserScroll = true)

    // Get the CURRENT scroll position
    const currentScroll = { x: window.scrollX, y: window.scrollY };

    // Disable scroll tracking during navigation
    this.scrollTrackingEnabled = false;

    // Force save the CURRENT scroll position again to be absolutely sure (with isUserScroll = true)
    this.stateService.setScrollPosition(currentScroll.x, currentScroll.y, true);

    // Ensure cache is saved
    this.stateService.setCachedCocktails(this.allCocktails());
    this.stateService.setHasMore(this.hasMore());

    this.router.navigate(['/cocktail', cocktail.idDrink]);
  }

  toggleFavoriteInTable(cocktail: Cocktail, event: Event): void {
    event.stopPropagation();
    if (this.favoritesService.isFavorite(cocktail.idDrink)) {
      this.favoritesService.removeFromFavorites(cocktail.idDrink);
    } else {
      this.favoritesService.addToFavorites(cocktail.idDrink);
    }
  }

  isFavorite(cocktailId: string): boolean {
    return this.favoritesService.isFavorite(cocktailId);
  }
}
