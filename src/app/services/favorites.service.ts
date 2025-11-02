import { Injectable, signal, computed, effect } from '@angular/core';
import { Cocktail } from '../models/cocktail.model';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'cocktail_favorites';
  private isInitializing = true;

  // Signal to hold favorites
  private favoritesSignal = signal<string[]>([]);

  // Public readonly computed signals
  public readonly favorites = this.favoritesSignal.asReadonly();
  public readonly favoritesCount = computed(() => this.favoritesSignal().length);

  constructor() {
    // Load favorites from localStorage on initialization
    this.loadFavoritesFromStorage();

    // Listen for storage changes from other tabs
    this.setupCrossTabSync();

    // Setup auto-save effect (skip first run to avoid saving during initialization)
    effect(() => {
      const currentFavorites = this.favoritesSignal();
      if (!this.isInitializing) {
        this.saveFavoritesToStorage(currentFavorites);
      }
    });

    // Mark initialization as complete
    this.isInitializing = false;
  }

  /**
   * Check if a cocktail is in favorites
   */
  isFavorite(cocktailId: string): boolean {
    return this.favoritesSignal().includes(cocktailId);
  }

  /**
   * Add a cocktail to favorites
   */
  addToFavorites(cocktailId: string): void {
    const current = this.favoritesSignal();
    if (!current.includes(cocktailId)) {
      this.favoritesSignal.set([...current, cocktailId]);
    }
  }

  /**
   * Remove a cocktail from favorites
   */
  removeFromFavorites(cocktailId: string): void {
    const current = this.favoritesSignal();
    this.favoritesSignal.set(current.filter((id) => id !== cocktailId));
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(cocktailId: string): void {
    if (this.isFavorite(cocktailId)) {
      this.removeFromFavorites(cocktailId);
    } else {
      this.addToFavorites(cocktailId);
    }
  }

  /**
   * Get all favorite IDs
   */
  getFavoriteIds(): string[] {
    return this.favoritesSignal();
  }

  /**
   * Clear all favorites
   */
  clearFavorites(): void {
    this.favoritesSignal.set([]);
  }

  /**
   * Load favorites from localStorage
   */
  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        if (Array.isArray(favorites)) {
          this.favoritesSignal.set(favorites);
        }
      }
    } catch (error) {
      // Handle potential JSON parsing errors silently
    }
  }

  /**
   * Save favorites to localStorage
   */
  private saveFavoritesToStorage(favorites: string[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      // Handle potential storage errors silently
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
      if (event.key === this.STORAGE_KEY && event.newValue) {
        try {
          const newFavorites = JSON.parse(event.newValue);
          if (Array.isArray(newFavorites)) {
            // Temporarily disable effect during sync
            const wasInitializing = this.isInitializing;
            this.isInitializing = true;
            this.favoritesSignal.set(newFavorites);
            this.isInitializing = wasInitializing;
          }
        } catch (error) {
          // Handle potential parsing errors silently
        }
      }
    });
  }
}
