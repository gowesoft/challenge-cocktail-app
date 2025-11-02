import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [FavoritesService],
    });
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty favorites', () => {
    expect(service.getFavoriteIds()).toEqual([]);
    expect(service.favoritesCount()).toBe(0);
  });

  it('should add a cocktail to favorites', () => {
    service.addToFavorites('123');
    expect(service.isFavorite('123')).toBe(true);
    expect(service.favoritesCount()).toBe(1);
  });

  it('should remove a cocktail from favorites', () => {
    service.addToFavorites('123');
    service.removeFromFavorites('123');
    expect(service.isFavorite('123')).toBe(false);
    expect(service.favoritesCount()).toBe(0);
  });

  it('should toggle favorite status', () => {
    expect(service.isFavorite('123')).toBe(false);
    service.toggleFavorite('123');
    expect(service.isFavorite('123')).toBe(true);
    service.toggleFavorite('123');
    expect(service.isFavorite('123')).toBe(false);
  });

  it('should not add duplicate favorites', () => {
    service.addToFavorites('123');
    service.addToFavorites('123');
    expect(service.favoritesCount()).toBe(1);
  });

  it('should clear all favorites', () => {
    service.addToFavorites('123');
    service.addToFavorites('456');
    service.clearFavorites();
    expect(service.favoritesCount()).toBe(0);
    expect(service.getFavoriteIds()).toEqual([]);
  });

  it('should get all favorite IDs', () => {
    service.addToFavorites('123');
    service.addToFavorites('456');
    const ids = service.getFavoriteIds();
    expect(ids).toContain('123');
    expect(ids).toContain('456');
    expect(ids.length).toBe(2);
  });

  it('should persist favorites to localStorage', (done) => {
    service.addToFavorites('123');

    // Wait for effect to save
    setTimeout(() => {
      const stored = localStorage.getItem('cocktail_favorites');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toContain('123');
      done();
    }, 100);
  });

  it('should load favorites from localStorage on initialization', () => {
    // Set data in localStorage
    localStorage.setItem('cocktail_favorites', JSON.stringify(['123', '456']));

    // Create a new TestBed with fresh service instance
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [FavoritesService],
    });

    // Inject the service (this will trigger constructor and load from localStorage)
    const newService = TestBed.inject(FavoritesService);

    expect(newService.getFavoriteIds()).toContain('123');
    expect(newService.getFavoriteIds()).toContain('456');
    expect(newService.favoritesCount()).toBe(2);
  });

  describe('additional favorite operations', () => {
    it('should handle multiple add operations', () => {
      service.addToFavorites('1');
      service.addToFavorites('2');
      service.addToFavorites('3');

      expect(service.favoritesCount()).toBe(3);
      expect(service.isFavorite('1')).toBe(true);
      expect(service.isFavorite('2')).toBe(true);
      expect(service.isFavorite('3')).toBe(true);
    });

    it('should handle removing non-existent favorite', () => {
      service.removeFromFavorites('999');
      expect(service.favoritesCount()).toBe(0);
    });

    it('should maintain favorites order', () => {
      service.addToFavorites('first');
      service.addToFavorites('second');
      service.addToFavorites('third');

      const ids = service.getFavoriteIds();
      expect(ids[0]).toBe('first');
      expect(ids[1]).toBe('second');
      expect(ids[2]).toBe('third');
    });

    it('should return false for non-favorite cocktail', () => {
      service.addToFavorites('123');
      expect(service.isFavorite('456')).toBe(false);
    });

    it('should handle empty string ID', () => {
      service.addToFavorites('');
      expect(service.favoritesCount()).toBe(1);
      expect(service.isFavorite('')).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist after removing favorite', (done) => {
      service.addToFavorites('123');
      service.addToFavorites('456');

      setTimeout(() => {
        service.removeFromFavorites('123');

        setTimeout(() => {
          const stored = localStorage.getItem('cocktail_favorites');
          expect(stored).toBeTruthy();
          const parsed = JSON.parse(stored!);
          expect(parsed).not.toContain('123');
          expect(parsed).toContain('456');
          done();
        }, 100);
      }, 100);
    });

    it('should persist after clearing favorites', (done) => {
      service.addToFavorites('123');
      service.addToFavorites('456');

      setTimeout(() => {
        service.clearFavorites();

        setTimeout(() => {
          const stored = localStorage.getItem('cocktail_favorites');
          expect(stored).toBeTruthy();
          const parsed = JSON.parse(stored!);
          expect(parsed).toEqual([]);
          done();
        }, 100);
      }, 100);
    });

    it('should handle corrupt localStorage data', () => {
      localStorage.setItem('cocktail_favorites', 'invalid json');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [FavoritesService],
      });

      const newService = TestBed.inject(FavoritesService);
      expect(newService.getFavoriteIds()).toEqual([]);
      expect(newService.favoritesCount()).toBe(0);
    });
  });

  describe('toggle operations', () => {
    it('should toggle multiple times correctly', () => {
      service.toggleFavorite('123');
      expect(service.isFavorite('123')).toBe(true);

      service.toggleFavorite('123');
      expect(service.isFavorite('123')).toBe(false);

      service.toggleFavorite('123');
      expect(service.isFavorite('123')).toBe(true);
    });

    it('should toggle different cocktails independently', () => {
      service.toggleFavorite('123');
      service.toggleFavorite('456');

      expect(service.isFavorite('123')).toBe(true);
      expect(service.isFavorite('456')).toBe(true);

      service.toggleFavorite('123');
      expect(service.isFavorite('123')).toBe(false);
      expect(service.isFavorite('456')).toBe(true);
    });
  });

  describe('cross-tab synchronization', () => {
    it('should sync favorites when storage event fires', () => {
      let storageHandler: ((event: StorageEvent) => void) | undefined;
      spyOn(window, 'addEventListener').and.callFake(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (type === 'storage') {
            storageHandler = listener as (event: StorageEvent) => void;
          }
        }
      );

      TestBed.resetTestingModule();
      const syncedService = TestBed.configureTestingModule({
        providers: [FavoritesService],
      }).inject(FavoritesService);

      expect(storageHandler).toBeDefined();

      const storageEvent = {
        key: 'cocktail_favorites',
        newValue: JSON.stringify(['alpha', 'beta']),
      } as StorageEvent;

      storageHandler!(storageEvent);

      expect(syncedService.getFavoriteIds()).toEqual(['alpha', 'beta']);
    });

    it('should ignore storage events with different keys', () => {
      let storageHandler: ((event: StorageEvent) => void) | undefined;
      spyOn(window, 'addEventListener').and.callFake(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (type === 'storage') {
            storageHandler = listener as (event: StorageEvent) => void;
          }
        }
      );

      TestBed.resetTestingModule();
      const syncedService = TestBed.configureTestingModule({
        providers: [FavoritesService],
      }).inject(FavoritesService);

      expect(storageHandler).toBeDefined();

      const storageEvent = {
        key: 'other_key',
        newValue: JSON.stringify(['alpha']),
      } as StorageEvent;

      storageHandler!(storageEvent);

      expect(syncedService.getFavoriteIds()).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle errors when loading from localStorage', (done) => {
      spyOn(localStorage, 'getItem').and.returnValue('invalid JSON {');

      TestBed.resetTestingModule();
      const localService = TestBed.configureTestingModule({
        providers: [FavoritesService],
      }).inject(FavoritesService);

      setTimeout(() => {
        // Service should initialize with empty favorites on JSON parse error
        expect(localService.favorites()).toEqual([]);
        done();
      }, 100);
    });

    it('should handle errors when saving to localStorage', (done) => {
      spyOn(localStorage, 'setItem').and.throwError('Storage full');

      const initialCount = service.favorites().length;
      service.addToFavorites('error-test-id');

      setTimeout(() => {
        // Service should continue to work despite save error
        expect(service.isFavorite('error-test-id')).toBe(true);
        done();
      }, 100);
    });
  });
});
