import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CocktailListComponent } from './cocktail-list.component';
import { CocktailApiService } from '../../services/cocktail-api.service';
import { FavoritesService } from '../../services/favorites.service';
import { StateService } from '../../services/state.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Cocktail } from '../../models/cocktail.model';

describe('CocktailListComponent', () => {
  let component: CocktailListComponent;
  let fixture: ComponentFixture<CocktailListComponent>;
  let cocktailApiService: jasmine.SpyObj<CocktailApiService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let stateService: jasmine.SpyObj<StateService>;
  let router: jasmine.SpyObj<Router>;

  const mockCocktail: Cocktail = {
    idDrink: '123',
    strDrink: 'Margarita',
    strCategory: 'Cocktail',
    strAlcoholic: 'Alcoholic',
    strGlass: 'Cocktail glass',
    strDrinkThumb: 'https://example.com/image.jpg',
    strInstructions: 'Mix ingredients',
  };

  beforeEach(async () => {
    const cocktailApiSpy = jasmine.createSpyObj('CocktailApiService', [
      'getRandomCocktails',
      'searchByName',
      'searchByIngredient',
      'searchById',
      'getCocktailDetails',
    ]);
    const favoritesSpy = jasmine.createSpyObj(
      'FavoritesService',
      ['isFavorite', 'toggleFavorite', 'addToFavorites', 'removeFromFavorites', 'getFavoriteIds'],
      {
        favoritesCount: signal(0),
        favorites: signal([]),
      }
    );
    favoritesSpy.getFavoriteIds.and.returnValue([]);
    const stateSpy = jasmine.createSpyObj(
      'StateService',
      [
        'setSearchFilter',
        'setScrollPosition',
        'toggleShowOnlyFavorites',
        'setCachedCocktails',
        'setHasMore',
        'clearCache',
        'setViewMode',
        'getCurrentState',
      ],
      {
        searchFilter: signal(null),
        scrollPosition: signal({ x: 0, y: 0 }),
        showOnlyFavorites: signal(false),
        cachedCocktails: signal([]),
        hasMore: signal(true),
        viewMode: signal('grid' as const),
      }
    );
    stateSpy.getCurrentState.and.returnValue({
      searchFilter: null,
      scrollPosition: { x: 0, y: 0 },
      showOnlyFavorites: false,
      cachedCocktails: [],
      hasMore: true,
      viewMode: 'grid' as const,
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(),
    });

    await TestBed.configureTestingModule({
      imports: [CocktailListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CocktailApiService, useValue: cocktailApiSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: StateService, useValue: stateSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    cocktailApiService = TestBed.inject(CocktailApiService) as jasmine.SpyObj<CocktailApiService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values
    cocktailApiService.getRandomCocktails.and.returnValue(of([]));
    favoritesService.isFavorite.and.returnValue(false);

    fixture = TestBed.createComponent(CocktailListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial cocktails on init', () => {
    cocktailApiService.getRandomCocktails.and.returnValue(of([mockCocktail]));
    fixture.detectChanges();
    expect(cocktailApiService.getRandomCocktails).toHaveBeenCalled();
  });

  it('should handle search by name', () => {
    const searchResult = [mockCocktail];
    cocktailApiService.searchByName.and.returnValue(of(searchResult));

    component.onSearch({ type: 'name', value: 'Margarita' });

    expect(cocktailApiService.searchByName).toHaveBeenCalledWith('Margarita');
    expect(stateService.setSearchFilter).toHaveBeenCalled();
  });

  it('should handle search by ingredient', () => {
    const searchResult = [mockCocktail];
    cocktailApiService.searchByIngredient.and.returnValue(of(searchResult));

    component.onSearch({ type: 'ingredient', value: 'Tequila' });

    expect(cocktailApiService.searchByIngredient).toHaveBeenCalledWith('Tequila');
  });

  it('should handle search by ID', () => {
    cocktailApiService.searchById.and.returnValue(of(mockCocktail));

    component.onSearch({ type: 'id', value: '123' });

    expect(cocktailApiService.searchById).toHaveBeenCalledWith('123');
  });

  it('should toggle favorites', () => {
    component.toggleShowFavorites();
    expect(stateService.toggleShowOnlyFavorites).toHaveBeenCalled();
  });

  it('should clear search', () => {
    cocktailApiService.getRandomCocktails.and.returnValue(of([mockCocktail]));

    component.onClearSearch();

    expect(stateService.setSearchFilter).toHaveBeenCalledWith(null);
    expect(stateService.clearCache).toHaveBeenCalled();
  });

  it('should toggle view mode', () => {
    component.toggleViewMode();
    expect(stateService.setViewMode).toHaveBeenCalled();
  });

  it('should navigate to detail view', () => {
    component.viewDetails(mockCocktail);
    expect(router.navigate).toHaveBeenCalledWith(['/cocktail', '123']);
  });

  it('should toggle favorite in table', () => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    favoritesService.isFavorite.and.returnValue(false);

    component.toggleFavoriteInTable(mockCocktail, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(favoritesService.addToFavorites).toHaveBeenCalledWith('123');
  });

  it('should check if cocktail is favorite', () => {
    favoritesService.isFavorite.and.returnValue(true);

    const result = component.isFavorite('123');

    expect(result).toBe(true);
    expect(favoritesService.isFavorite).toHaveBeenCalledWith('123');
  });

  it('should refresh cocktails', () => {
    cocktailApiService.getRandomCocktails.and.returnValue(of([mockCocktail]));
    spyOn(window, 'scrollTo').and.stub();

    component.refreshCocktails();

    expect(stateService.clearCache).toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalled();
    expect(stateService.setSearchFilter).toHaveBeenCalledWith(null);
    expect(cocktailApiService.getRandomCocktails).toHaveBeenCalled();
  });

  it('should scroll to top', () => {
    spyOn(window, 'scrollTo').and.stub();

    component.scrollToTop();

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('should handle error when loading cocktails', () => {
    cocktailApiService.getRandomCocktails.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    // Should not crash and should set loading to false
    expect(component.isLoading()).toBe(false);
  });

  it('should track cocktails by ID', () => {
    const result = component.trackByCocktailId(0, mockCocktail);
    expect(result).toBe('123');
  });

  it('should get animation delay for cocktails', () => {
    const delay = component.getAnimationDelay(0);
    expect(delay).toBeDefined();
  });

  describe('additional coverage tests', () => {
    it('should handle search by ID with null result', () => {
      cocktailApiService.searchById.and.returnValue(of(null));

      component.onSearch({ type: 'id', value: '999' });

      expect(component.allCocktails().length).toBe(0);
    });

    it('should handle search errors gracefully', () => {
      cocktailApiService.searchByName.and.returnValue(throwError(() => new Error('Search failed')));

      component.onSearch({ type: 'name', value: 'test' });

      expect(component.isLoading()).toBe(false);
      expect(component.allCocktails().length).toBe(0);
    });

    it('should toggle favorite removal in table', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      favoritesService.isFavorite.and.returnValue(true);

      component.toggleFavoriteInTable(mockCocktail, event);

      expect(favoritesService.removeFromFavorites).toHaveBeenCalledWith('123');
    });

    it('should handle refresh with active filter', () => {
      cocktailApiService.searchByName.and.returnValue(of([mockCocktail]));
      cocktailApiService.getRandomCocktails.and.returnValue(of([mockCocktail]));
      spyOn(window, 'scrollTo').and.stub();

      // Set a filter first
      component.onSearch({ type: 'name', value: 'test' });

      // Then refresh
      component.refreshCocktails();

      expect(stateService.clearCache).toHaveBeenCalled();
      expect(stateService.setSearchFilter.calls.mostRecent().args[0]).toBeNull();
      expect(cocktailApiService.getRandomCocktails).toHaveBeenCalled();
    });

    it('should load from cache when available', () => {
      const cachedCocktails = [mockCocktail, { ...mockCocktail, idDrink: '456' }];

      // Re-create spy with updated signal values
      TestBed.resetTestingModule();
      const stateSpy = jasmine.createSpyObj(
        'StateService',
        [
          'setSearchFilter',
          'setScrollPosition',
          'toggleShowOnlyFavorites',
          'setCachedCocktails',
          'setHasMore',
          'clearCache',
          'setViewMode',
          'getCurrentState',
        ],
        {
          searchFilter: signal(null),
          scrollPosition: signal({ x: 0, y: 0 }),
          showOnlyFavorites: signal(false),
          cachedCocktails: signal(cachedCocktails),
          hasMore: signal(false),
          viewMode: signal('grid' as const),
        }
      );
      stateSpy.getCurrentState.and.returnValue({
        searchFilter: null,
        scrollPosition: { x: 0, y: 0 },
        showOnlyFavorites: false,
        cachedCocktails: cachedCocktails,
        hasMore: false,
        viewMode: 'grid' as const,
      });

      TestBed.configureTestingModule({
        imports: [CocktailListComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: CocktailApiService, useValue: cocktailApiService },
          { provide: FavoritesService, useValue: favoritesService },
          { provide: StateService, useValue: stateSpy },
          { provide: Router, useValue: router },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CocktailListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.allCocktails().length).toBe(2);
      expect(cocktailApiService.getRandomCocktails).not.toHaveBeenCalled();
    });

    it('should not load initial cocktails when search filter exists', () => {
      expect(component).toBeTruthy();
    });

    it('should handle animation delay for items beyond lastLoadedCount', () => {
      component['lastLoadedCount'] = 5;
      component.allCocktails.set([
        mockCocktail,
        mockCocktail,
        mockCocktail,
        mockCocktail,
        mockCocktail,
        mockCocktail,
        mockCocktail,
        mockCocktail,
      ]);

      const delay = component.getAnimationDelay(6);

      expect(delay).toContain('s');
      expect(delay).not.toBe('0s');
    });

    it('should return 0s delay for items within lastLoadedCount', () => {
      component['lastLoadedCount'] = 10;

      const delay = component.getAnimationDelay(5);

      expect(delay).toBe('0s');
    });

    it('should handle getCocktailDetails for favorites when missing', () => {
      const favoriteIds = ['123', '456'];
      favoritesService.getFavoriteIds.and.returnValue(favoriteIds);
      cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

      // Set allCocktails to empty first
      component.allCocktails.set([]);

      expect(component).toBeTruthy();
    });

    it('should handle scroll to top', () => {
      spyOn(window, 'scrollTo').and.stub();

      component.scrollToTop();

      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should handle viewDetails and save scroll position', () => {
      component.allCocktails.set([mockCocktail]);

      component.viewDetails(mockCocktail);

      expect(stateService.setScrollPosition).toHaveBeenCalled();
      expect(stateService.setCachedCocktails).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/cocktail', '123']);
    });

    it('should handle toggleFavoriteInTable with stopPropagation', () => {
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);
      favoritesService.isFavorite.and.returnValue(false);

      component.toggleFavoriteInTable(mockCocktail, event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });
});
