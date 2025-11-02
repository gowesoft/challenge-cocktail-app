import { Injectable, signal, effect } from '@angular/core';
import { AppState, SearchFilter, Cocktail } from '@app/models/cocktail.model';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private readonly STATE_STORAGE_KEY = 'cocktail_app_state';
  private isInitializing = true;
  private lastSavedScrollY = 0; // Track last saved scroll position

  // Signals for application state
  private searchFilterSignal = signal<SearchFilter | null>(null);
  private scrollPositionSignal = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  private showOnlyFavoritesSignal = signal<boolean>(false);
  private cachedCocktailsSignal = signal<Cocktail[]>([]);
  private hasMoreSignal = signal<boolean>(true);
  private viewModeSignal = signal<'grid' | 'table'>('grid');

  // Public readonly signals
  public readonly searchFilter = this.searchFilterSignal.asReadonly();
  public readonly scrollPosition = this.scrollPositionSignal.asReadonly();
  public readonly showOnlyFavorites = this.showOnlyFavoritesSignal.asReadonly();
  public readonly cachedCocktails = this.cachedCocktailsSignal.asReadonly();
  public readonly hasMore = this.hasMoreSignal.asReadonly();
  public readonly viewMode = this.viewModeSignal.asReadonly();

  constructor() {
    // Load state from storage on initialization
    this.loadState();

    // Setup auto-save effect (skip first run to avoid saving during initialization)
    effect(() => {
      const currentScroll = this.scrollPositionSignal();

      const state: AppState = {
        searchFilter: this.searchFilterSignal(),
        scrollPosition: currentScroll,
        showOnlyFavorites: this.showOnlyFavoritesSignal(),
        cachedCocktails: this.cachedCocktailsSignal(),
        hasMore: this.hasMoreSignal(),
        viewMode: this.viewModeSignal(),
      };

      if (!this.isInitializing) {
        this.saveState(state);
        this.lastSavedScrollY = currentScroll.y;
      }
    });

    // Setup cross-tab synchronization
    this.setupCrossTabSync();

    // Mark initialization as complete
    this.isInitializing = false;
  }

  /**
   * Update search filter
   */
  setSearchFilter(filter: SearchFilter | null): void {
    this.searchFilterSignal.set(filter);
  }

  /**
   * Update scroll position
   */
  setScrollPosition(x: number, y: number, isUserScroll: boolean = false): void {
    // Treat very small scroll values as 0 (prevents floating point errors)
    const cleanY = y < 10 ? 0 : y;
    const cleanX = x < 10 ? 0 : x;

    // Prevent unintentional reset to 0 during navigation
    // BUT allow it if it's from user scrolling (isUserScroll = true)
    const isUnintentionalReset =
      cleanY === 0 && this.lastSavedScrollY > 100 && !this.isInitializing && !isUserScroll;

    if (isUnintentionalReset) {
      return; // Don't even update the signal!
    }

    this.scrollPositionSignal.set({ x: cleanX, y: cleanY });
  }

  /**
   * Toggle show only favorites
   */
  toggleShowOnlyFavorites(): void {
    this.showOnlyFavoritesSignal.update((current) => !current);
  }

  /**
   * Set show only favorites
   */
  setShowOnlyFavorites(value: boolean): void {
    this.showOnlyFavoritesSignal.set(value);
  }

  /**
   * Set cached cocktails
   */
  setCachedCocktails(cocktails: Cocktail[]): void {
    this.cachedCocktailsSignal.set(cocktails);
  }

  /**
   * Set has more flag
   */
  setHasMore(value: boolean): void {
    this.hasMoreSignal.set(value);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedCocktailsSignal.set([]);
    this.hasMoreSignal.set(true);
  }

  /**
   * Set view mode
   */
  setViewMode(mode: 'grid' | 'table'): void {
    this.viewModeSignal.set(mode);
  }

  /**
   * Get current state
   */
  getCurrentState(): AppState {
    return {
      searchFilter: this.searchFilterSignal(),
      scrollPosition: this.scrollPositionSignal(),
      showOnlyFavorites: this.showOnlyFavoritesSignal(),
      cachedCocktails: this.cachedCocktailsSignal(),
      hasMore: this.hasMoreSignal(),
      viewMode: this.viewModeSignal(),
    };
  }

  /**
   * Save state to localStorage
   */
  private saveState(state: AppState): void {
    try {
      localStorage.setItem(this.STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Handle potential storage errors silently
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.STATE_STORAGE_KEY);
      if (stored) {
        const state: AppState = JSON.parse(stored);
        this.searchFilterSignal.set(state.searchFilter || null);
        this.scrollPositionSignal.set(state.scrollPosition || { x: 0, y: 0 });
        this.showOnlyFavoritesSignal.set(state.showOnlyFavorites || false);
        this.cachedCocktailsSignal.set(state.cachedCocktails || []);
        this.hasMoreSignal.set(state.hasMore !== undefined ? state.hasMore : true);
        this.viewModeSignal.set(state.viewMode || 'grid');

        // Initialize lastSavedScrollY with loaded value
        this.lastSavedScrollY = state.scrollPosition?.y || 0;
      }
    } catch (error) {
      // Handle potential parsing errors silently
    }
  }

  /**
   * Setup cross-tab synchronization
   * Note: The 'storage' event only fires in OTHER tabs, not the current one
   * This is the native browser behavior and prevents infinite loops
   */
  private setupCrossTabSync(): void {
    window.addEventListener('storage', (event) => {
      // Only listen to changes from other tabs
      if (event.key === this.STATE_STORAGE_KEY && event.newValue) {
        try {
          const state: AppState = JSON.parse(event.newValue);
          // Temporarily disable effect during sync
          const wasInitializing = this.isInitializing;
          this.isInitializing = true;
          this.searchFilterSignal.set(state.searchFilter || null);
          this.scrollPositionSignal.set(state.scrollPosition || { x: 0, y: 0 });
          this.showOnlyFavoritesSignal.set(state.showOnlyFavorites || false);
          this.cachedCocktailsSignal.set(state.cachedCocktails || []);
          this.hasMoreSignal.set(state.hasMore !== undefined ? state.hasMore : true);
          this.viewModeSignal.set(state.viewMode || 'grid');
          this.isInitializing = wasInitializing;
        } catch (error) {
          // Handle potential parsing errors silently
        }
      }
    });
  }
}
