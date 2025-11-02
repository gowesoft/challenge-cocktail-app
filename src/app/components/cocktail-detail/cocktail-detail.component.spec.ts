import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CocktailDetailComponent } from './cocktail-detail.component';
import { CocktailApiService } from '@app/services/cocktail-api.service';
import { FavoritesService } from '@app/services/favorites.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Cocktail } from '@app/models/cocktail.model';

describe('CocktailDetailComponent', () => {
  let component: CocktailDetailComponent;
  let fixture: ComponentFixture<CocktailDetailComponent>;
  let cocktailApiService: jasmine.SpyObj<CocktailApiService>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let location: jasmine.SpyObj<Location>;
  let router: jasmine.SpyObj<Router>;

  const mockCocktail: Cocktail = {
    idDrink: '123',
    strDrink: 'Margarita',
    strCategory: 'Cocktail',
    strAlcoholic: 'Alcoholic',
    strGlass: 'Cocktail glass',
    strDrinkThumb: 'https://example.com/image.jpg',
    strInstructions: 'Mix ingredients with ice',
    strIngredient1: 'Tequila',
    strIngredient2: 'Lime juice',
    strMeasure1: '2 oz',
    strMeasure2: '1 oz',
    strTags: 'IBA,Classic',
    strIBA: 'Contemporary Classics',
  };

  beforeEach(async () => {
    const cocktailApiSpy = jasmine.createSpyObj('CocktailApiService', ['getCocktailDetails']);
    const favoritesSpy = jasmine.createSpyObj('FavoritesService', ['isFavorite', 'toggleFavorite']);
    const locationSpy = jasmine.createSpyObj('Location', ['back']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(),
    });

    await TestBed.configureTestingModule({
      imports: [CocktailDetailComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CocktailApiService, useValue: cocktailApiSpy },
        { provide: FavoritesService, useValue: favoritesSpy },
        { provide: Location, useValue: locationSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '123' }),
          },
        },
      ],
    }).compileComponents();

    cocktailApiService = TestBed.inject(CocktailApiService) as jasmine.SpyObj<CocktailApiService>;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(CocktailDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cocktail details on init', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));
    spyOn(window, 'scrollTo');

    fixture.detectChanges();

    expect(cocktailApiService.getCocktailDetails).toHaveBeenCalledWith('123');
    expect(component.cocktail()).toEqual(mockCocktail);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should handle error when loading cocktail', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load cocktail details');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle null cocktail response', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(null));

    fixture.detectChanges();

    expect(component.error()).toBe('Cocktail not found');
    expect(component.isLoading()).toBe(false);
  });

  it('should extract ingredients correctly', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();

    const ingredients = component.ingredients();
    expect(ingredients.length).toBe(2);
    expect(ingredients[0].name).toBe('Tequila');
    expect(ingredients[0].measure).toBe('2 oz');
    expect(ingredients[1].name).toBe('Lime juice');
    expect(ingredients[1].measure).toBe('1 oz');
  });

  it('should get instructions', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();

    expect(component.instructions()).toBe('Mix ingredients with ice');
  });

  it('should parse tags correctly', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();

    const tags = component.tags();
    expect(tags.length).toBe(2);
    expect(tags).toContain('IBA');
    expect(tags).toContain('Classic');
  });

  it('should return empty array when no tags', () => {
    const cocktailWithoutTags = { ...mockCocktail, strTags: undefined };
    cocktailApiService.getCocktailDetails.and.returnValue(of(cocktailWithoutTags));

    fixture.detectChanges();

    expect(component.tags()).toEqual([]);
  });

  it('should check if cocktail is favorite', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));
    favoritesService.isFavorite.and.returnValue(true);

    fixture.detectChanges();

    expect(component.isFavorite()).toBe(true);
  });

  it('should toggle favorite', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();

    component.toggleFavorite();

    expect(favoritesService.toggleFavorite).toHaveBeenCalledWith('123');
  });

  it('should not toggle favorite when no cocktail loaded', () => {
    component.toggleFavorite();

    expect(favoritesService.toggleFavorite).not.toHaveBeenCalled();
  });

  it('should go back using Location', () => {
    component.goBack();

    expect(location.back).toHaveBeenCalled();
  });

  it('should handle image load event', () => {
    const event = new Event('load');

    component.onImageLoad(event);

    expect(component.imageLoaded()).toBe(true);
  });

  it('should reset image loaded state when loading new cocktail', () => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();
    component.onImageLoad(new Event('load'));
    expect(component.imageLoaded()).toBe(true);

    // Load another cocktail
    cocktailApiService.getCocktailDetails.and.returnValue(of({ ...mockCocktail, idDrink: '456' }));
    component['loadCocktailDetails']('456');

    expect(component.imageLoaded()).toBe(false);
  });

  it('should set content ready after delay', (done) => {
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.contentReady()).toBe(true);
      done();
    }, 200);
  });

  it('should handle missing route parameter', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    (activatedRoute.params as any) = of({});
    cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

    fixture.detectChanges();

    expect(component.error()).toBe('No cocktail ID provided');
    expect(component.isLoading()).toBe(false);
  });

  describe('additional coverage tests', () => {
    it('should set error when cocktail not found', () => {
      cocktailApiService.getCocktailDetails.and.returnValue(of(null));

      fixture.detectChanges();

      expect(component.error()).toBe('Cocktail not found');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle API errors', () => {
      cocktailApiService.getCocktailDetails.and.returnValue(
        throwError(() => new Error('API failed'))
      );

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load cocktail details');
      expect(component.isLoading()).toBe(false);
    });

    it('should scroll to top on init', () => {
      spyOn(window, 'scrollTo').and.stub();
      cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

      fixture.detectChanges();

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('should reset contentReady when loading new cocktail', (done) => {
      cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));

      fixture.detectChanges();

      // Wait for contentReady to be set
      setTimeout(() => {
        expect(component.contentReady()).toBe(true);

        // Load new cocktail
        component['loadCocktailDetails']('456');
        expect(component.contentReady()).toBe(false);
        done();
      }, 200);
    });

    it('should handle cocktail with empty instructions', () => {
      const cocktailNoInstructions = { ...mockCocktail, strInstructions: '' };
      cocktailApiService.getCocktailDetails.and.returnValue(of(cocktailNoInstructions));

      fixture.detectChanges();

      expect(component.instructions()).toBe('No instructions available.');
    });

    it('should handle cocktail with null category', () => {
      const cocktailNoCategory = { ...mockCocktail, strCategory: undefined };
      cocktailApiService.getCocktailDetails.and.returnValue(of(cocktailNoCategory));

      fixture.detectChanges();

      expect(component.cocktail()?.strCategory).toBeUndefined();
    });

    it('should handle cocktail with null alcoholic', () => {
      const cocktailNoAlcoholic = { ...mockCocktail, strAlcoholic: undefined };
      cocktailApiService.getCocktailDetails.and.returnValue(of(cocktailNoAlcoholic));

      fixture.detectChanges();

      expect(component.cocktail()?.strAlcoholic).toBeUndefined();
    });

    it('should handle cocktail with null glass', () => {
      const cocktailNoGlass = { ...mockCocktail, strGlass: undefined };
      cocktailApiService.getCocktailDetails.and.returnValue(of(cocktailNoGlass));

      fixture.detectChanges();

      expect(component.cocktail()?.strGlass).toBeUndefined();
    });

    it('should destroy subscription on component destroy', () => {
      cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should reset error state when loading new cocktail', () => {
      // First load with error
      cocktailApiService.getCocktailDetails.and.returnValue(
        throwError(() => new Error('First error'))
      );
      fixture.detectChanges();
      expect(component.error()).toBe('Failed to load cocktail details');

      // Then load successfully
      cocktailApiService.getCocktailDetails.and.returnValue(of(mockCocktail));
      component['loadCocktailDetails']('123');

      expect(component.error()).toBeNull();
    });
  });
});
