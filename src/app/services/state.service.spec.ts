import { TestBed } from '@angular/core/testing';
import { StateService } from './state.service';
import { SearchFilter } from '../models/cocktail.model';

describe('StateService', () => {
  let service: StateService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [StateService],
    });
    service = TestBed.inject(StateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.searchFilter()).toBeNull();
    expect(service.scrollPosition()).toEqual({ x: 0, y: 0 });
    expect(service.showOnlyFavorites()).toBe(false);
  });

  it('should set search filter', () => {
    const filter: SearchFilter = { type: 'name', value: 'margarita' };
    service.setSearchFilter(filter);
    expect(service.searchFilter()).toEqual(filter);
  });

  it('should set scroll position', () => {
    service.setScrollPosition(100, 200);
    expect(service.scrollPosition()).toEqual({ x: 100, y: 200 });
  });

  it('should toggle show only favorites', () => {
    expect(service.showOnlyFavorites()).toBe(false);
    service.toggleShowOnlyFavorites();
    expect(service.showOnlyFavorites()).toBe(true);
    service.toggleShowOnlyFavorites();
    expect(service.showOnlyFavorites()).toBe(false);
  });

  it('should set show only favorites', () => {
    service.setShowOnlyFavorites(true);
    expect(service.showOnlyFavorites()).toBe(true);
    service.setShowOnlyFavorites(false);
    expect(service.showOnlyFavorites()).toBe(false);
  });

  it('should get current state', () => {
    const filter: SearchFilter = { type: 'name', value: 'mojito' };
    service.setSearchFilter(filter);
    service.setScrollPosition(50, 100);
    service.setShowOnlyFavorites(true);

    const state = service.getCurrentState();
    expect(state.searchFilter).toEqual(filter);
    expect(state.scrollPosition).toEqual({ x: 50, y: 100 });
    expect(state.showOnlyFavorites).toBe(true);
  });

  it('should persist state to localStorage', (done) => {
    service.setSearchFilter({ type: 'name', value: 'test' });

    // Wait for effect to save
    setTimeout(() => {
      const stored = localStorage.getItem('cocktail_app_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.searchFilter).toEqual({ type: 'name', value: 'test' });
      done();
    }, 100);
  });

  it('should load state from localStorage on initialization', () => {
    const testState = {
      searchFilter: { type: 'name' as const, value: 'margarita' },
      scrollPosition: { x: 50, y: 100 },
      showOnlyFavorites: true,
      cachedCocktails: [],
      hasMore: true,
      viewMode: 'grid' as const,
    };

    localStorage.setItem('cocktail_app_state', JSON.stringify(testState));

    // Create a new TestBed with fresh service instance
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [StateService],
    });

    const newService = TestBed.inject(StateService);

    expect(newService.searchFilter()).toEqual(testState.searchFilter);
    expect(newService.scrollPosition()).toEqual(testState.scrollPosition);
    expect(newService.showOnlyFavorites()).toBe(true);
  });

  describe('cached cocktails', () => {
    it('should set cached cocktails', () => {
      const cocktails = [
        { idDrink: '1', strDrink: 'Margarita' } as any,
        { idDrink: '2', strDrink: 'Mojito' } as any,
      ];
      service.setCachedCocktails(cocktails);
      expect(service.cachedCocktails().length).toBe(2);
    });

    it('should clear cached cocktails', () => {
      const cocktails = [{ idDrink: '1', strDrink: 'Margarita' } as any];
      service.setCachedCocktails(cocktails);
      expect(service.cachedCocktails().length).toBe(1);

      service.clearCache();
      expect(service.cachedCocktails().length).toBe(0);
      expect(service.hasMore()).toBe(true);
    });

    it('should set hasMore flag', () => {
      expect(service.hasMore()).toBe(true);
      service.setHasMore(false);
      expect(service.hasMore()).toBe(false);
    });
  });

  describe('view mode', () => {
    it('should initialize with grid view mode', () => {
      expect(service.viewMode()).toBe('grid');
    });

    it('should set view mode to table', () => {
      service.setViewMode('table');
      expect(service.viewMode()).toBe('table');
    });

    it('should set view mode to grid', () => {
      service.setViewMode('table');
      service.setViewMode('grid');
      expect(service.viewMode()).toBe('grid');
    });
  });

  describe('scroll position edge cases', () => {
    it('should clean small scroll values to 0', () => {
      service.setScrollPosition(5, 8, true);
      expect(service.scrollPosition()).toEqual({ x: 0, y: 0 });
    });

    it('should not clean values >= 10', () => {
      service.setScrollPosition(10, 15, true);
      expect(service.scrollPosition()).toEqual({ x: 10, y: 15 });
    });

    it('should block unintentional resets when not user scroll', (done) => {
      // Set a significant scroll position first
      service.setScrollPosition(100, 500, true);

      setTimeout(() => {
        // Try to reset to 0 without isUserScroll flag
        service.setScrollPosition(0, 0, false);

        // Should still be at previous position (blocked)
        setTimeout(() => {
          const position = service.scrollPosition();
          // The position should not have changed to 0
          expect(position.y).toBeGreaterThan(0);
          done();
        }, 50);
      }, 100);
    });

    it('should allow intentional reset when user scrolls', (done) => {
      service.setScrollPosition(100, 500, true);

      setTimeout(() => {
        // User intentionally scrolls to top
        service.setScrollPosition(0, 0, true);

        setTimeout(() => {
          expect(service.scrollPosition()).toEqual({ x: 0, y: 0 });
          done();
        }, 50);
      }, 100);
    });
  });

  describe('search filter variations', () => {
    it('should set ingredient filter', () => {
      const filter: SearchFilter = { type: 'ingredient', value: 'vodka' };
      service.setSearchFilter(filter);
      expect(service.searchFilter()).toEqual(filter);
    });

    it('should set id filter', () => {
      const filter: SearchFilter = { type: 'id', value: '12345' };
      service.setSearchFilter(filter);
      expect(service.searchFilter()).toEqual(filter);
    });

    it('should clear filter by setting to null', () => {
      service.setSearchFilter({ type: 'name', value: 'test' });
      service.setSearchFilter(null);
      expect(service.searchFilter()).toBeNull();
    });
  });

  describe('getCurrentState', () => {
    it('should include all state properties', () => {
      const filter: SearchFilter = { type: 'ingredient', value: 'rum' };
      const cocktails = [{ idDrink: '1', strDrink: 'Test' } as any];

      service.setSearchFilter(filter);
      service.setScrollPosition(50, 100, true);
      service.setShowOnlyFavorites(true);
      service.setCachedCocktails(cocktails);
      service.setHasMore(false);
      service.setViewMode('table');

      const state = service.getCurrentState();

      expect(state.searchFilter).toEqual(filter);
      expect(state.scrollPosition).toEqual({ x: 50, y: 100 });
      expect(state.showOnlyFavorites).toBe(true);
      expect(state.cachedCocktails?.length).toBe(1);
      expect(state.hasMore).toBe(false);
      expect(state.viewMode).toBe('table');
    });
  });

  describe('cross-tab synchronization', () => {
    it('should update state when storage event fires', () => {
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
        providers: [StateService],
      }).inject(StateService);

      expect(storageHandler).toBeDefined();

      const newState = {
        searchFilter: { type: 'ingredient' as const, value: 'gin' },
        scrollPosition: { x: 25, y: 450 },
        showOnlyFavorites: true,
        cachedCocktails: [{ idDrink: '101', strDrink: 'Negroni' }] as any[],
        hasMore: false,
        viewMode: 'table' as const,
      };

      const storageEvent = {
        key: 'cocktail_app_state',
        newValue: JSON.stringify(newState),
      } as StorageEvent;

      storageHandler!(storageEvent);

      expect(syncedService.searchFilter()).toEqual(newState.searchFilter);
      expect(syncedService.scrollPosition()).toEqual(newState.scrollPosition);
      expect(syncedService.showOnlyFavorites()).toBe(true);
      expect(syncedService.cachedCocktails().length).toBe(1);
      expect(syncedService.hasMore()).toBe(false);
      expect(syncedService.viewMode()).toBe('table');
    });

    it('should ignore storage events without data', () => {
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
        providers: [StateService],
      }).inject(StateService);

      expect(storageHandler).toBeDefined();

      const storageEvent = {
        key: 'cocktail_app_state',
        newValue: null,
      } as StorageEvent;

      storageHandler!(storageEvent);

      expect(syncedService.searchFilter()).toBeNull();
      expect(syncedService.cachedCocktails()).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle errors when loading state from localStorage', (done) => {
      spyOn(localStorage, 'getItem').and.returnValue('invalid JSON {');

      TestBed.resetTestingModule();
      const localService = TestBed.configureTestingModule({
        providers: [StateService],
      }).inject(StateService);

      setTimeout(() => {
        // Service should initialize with default state on JSON parse error
        expect(localService.searchFilter()).toBeNull();
        expect(localService.scrollPosition()).toEqual({ x: 0, y: 0 });
        done();
      }, 100);
    });

    it('should handle errors when saving state to localStorage', (done) => {
      spyOn(localStorage, 'setItem').and.throwError('Storage full');

      const filter: SearchFilter = { type: 'name' as const, value: 'test' };
      service.setSearchFilter(filter);

      setTimeout(() => {
        // Service should continue to work despite save error
        expect(service.searchFilter()).toEqual(filter);
        done();
      }, 100);
    });
  });
});
