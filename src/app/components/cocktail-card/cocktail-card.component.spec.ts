import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CocktailCardComponent } from './cocktail-card.component';
import { FavoritesService } from '../../services/favorites.service';
import { Router } from '@angular/router';
import { Cocktail } from '../../models/cocktail.model';
import { SimpleChange } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CocktailCardComponent', () => {
  let component: CocktailCardComponent;
  let fixture: ComponentFixture<CocktailCardComponent>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let router: jasmine.SpyObj<Router>;

  const mockCocktail: Cocktail = {
    idDrink: '123',
    strDrink: 'Margarita',
    strCategory: 'Cocktail',
    strAlcoholic: 'Alcoholic',
    strGlass: 'Cocktail glass',
    strDrinkThumb: 'https://example.com/image.jpg',
  };

  beforeEach(async () => {
    const favoritesServiceSpy = jasmine.createSpyObj('FavoritesService', [
      'isFavorite',
      'toggleFavorite',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CocktailCardComponent, BrowserAnimationsModule],
      providers: [
        { provide: FavoritesService, useValue: favoritesServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(CocktailCardComponent);
    component = fixture.componentInstance;
    component.cocktail = mockCocktail;
    favoritesService.isFavorite.and.returnValue(false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cocktail name', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('mat-card-title');
    expect(title.textContent).toContain('Margarita');
  });

  it('should display cocktail category', () => {
    const compiled = fixture.nativeElement;
    const subtitle = compiled.querySelector('mat-card-subtitle');
    expect(subtitle.textContent).toContain('Cocktail');
  });

  it('should display cocktail image', () => {
    const compiled = fixture.nativeElement;
    const img = compiled.querySelector('img');
    expect(img.src).toBe('https://example.com/image.jpg');
    expect(img.alt).toBe('Margarita');
  });

  it('should emit viewDetails event on view details click', () => {
    spyOn(component.viewDetails, 'emit');
    component.onViewDetails();
    expect(component.viewDetails.emit).toHaveBeenCalledWith('123');
  });

  it('should toggle favorite on button click', () => {
    component.onToggleFavorite();
    expect(favoritesService.toggleFavorite).toHaveBeenCalledWith('123');
  });

  it('should check if cocktail is favorite on init', () => {
    expect(favoritesService.isFavorite).toHaveBeenCalledWith('123');
  });

  it('should update favorite status', () => {
    favoritesService.isFavorite.and.returnValue(true);
    component['updateFavoriteStatus']();
    expect(component.isFavorite()).toBe(true);
  });

  it('should show favorite icon when cocktail is favorite', () => {
    favoritesService.isFavorite.and.returnValue(true);
    component['updateFavoriteStatus']();
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const favoriteIcon = Array.from(icons).find(
      (icon: any) => icon.textContent.trim() === 'favorite'
    );
    expect(favoriteIcon).toBeTruthy();
  });

  it('should show favorite_border icon when cocktail is not favorite', () => {
    favoritesService.isFavorite.and.returnValue(false);
    component['updateFavoriteStatus']();
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const favoriteIcon = Array.from(icons).find(
      (icon: any) => icon.textContent.trim() === 'favorite_border'
    );
    expect(favoriteIcon).toBeTruthy();
  });

  it('should handle image load event', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/image.jpg';

    component.onImageLoad({ target: img } as unknown as Event);

    expect(component.imageLoaded()).toBe(true);
  });

  it('should display alcoholic status', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    expect(content).toContain('Alcoholic');
  });

  it('should display glass type', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.querySelector('mat-card-content');
    expect(content.textContent).toContain('Cocktail glass');
  });

  it('should handle missing optional fields', () => {
    const minimalCocktail: Cocktail = {
      idDrink: '456',
      strDrink: 'Simple Drink',
    };

    component.cocktail = minimalCocktail;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('mat-card-title');
    expect(title.textContent).toContain('Simple Drink');
  });

  describe('additional coverage tests', () => {
    it('should handle image with no thumbnail URL', () => {
      const cocktailNoImage: Cocktail = {
        ...mockCocktail,
        strDrinkThumb: undefined,
      };

      component.cocktail = cocktailNoImage;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const img = compiled.querySelector('img');
      expect(img).toBeTruthy();
    });

    it('should set image loaded state to false initially', () => {
      expect(component.imageLoaded()).toBe(false);
    });

    it('should update isFavorite signal when toggling favorite', () => {
      favoritesService.isFavorite.and.returnValue(false);
      component['updateFavoriteStatus']();
      expect(component.isFavorite()).toBe(false);

      favoritesService.isFavorite.and.returnValue(true);
      component['updateFavoriteStatus']();
      expect(component.isFavorite()).toBe(true);
    });

    it('should handle cocktail with null category', () => {
      const cocktailNoCategory: Cocktail = {
        ...mockCocktail,
        strCategory: undefined,
      };

      component.cocktail = cocktailNoCategory;
      fixture.detectChanges();

      // With undefined category, just verify component doesn't crash
      expect(component.cocktail).toBeTruthy();
    });

    it('should handle cocktail with null alcoholic', () => {
      const cocktailNoAlcoholic: Cocktail = {
        ...mockCocktail,
        strAlcoholic: undefined,
      };

      component.cocktail = cocktailNoAlcoholic;
      fixture.detectChanges();

      // Should still render without crashing
      expect(component).toBeTruthy();
    });

    it('should handle cocktail with null glass', () => {
      const cocktailNoGlass: Cocktail = {
        ...mockCocktail,
        strGlass: undefined,
      };

      component.cocktail = cocktailNoGlass;
      fixture.detectChanges();

      // Should still render without crashing
      expect(component).toBeTruthy();
    });

    it('should emit correct cocktail ID on view details', () => {
      const cocktail2: Cocktail = {
        ...mockCocktail,
        idDrink: '999',
      };

      component.cocktail = cocktail2;
      spyOn(component.viewDetails, 'emit');

      component.onViewDetails();

      expect(component.viewDetails.emit).toHaveBeenCalledWith('999');
    });

    it('should handle multiple image load events', () => {
      const img1 = document.createElement('img');
      img1.src = 'https://example.com/image.jpg';
      const img2 = document.createElement('img');
      img2.src = 'https://example.com/image.jpg';

      component.onImageLoad({ target: img1 } as unknown as Event);
      expect(component.imageLoaded()).toBe(true);

      component.onImageLoad({ target: img2 } as unknown as Event);
      expect(component.imageLoaded()).toBe(true);
    });

    it('should toggle favorite from false to true', () => {
      favoritesService.isFavorite.and.returnValue(false);
      component['updateFavoriteStatus']();

      component.onToggleFavorite();

      expect(favoritesService.toggleFavorite).toHaveBeenCalledWith('123');
    });

    it('should keep image visible when cocktail changes with same image', () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      component.onImageLoad({ target: img } as unknown as Event);
      expect(component.imageLoaded()).toBe(true);

      component.cocktail = { ...mockCocktail };
      component.ngOnChanges({
        cocktail: new SimpleChange(mockCocktail, component.cocktail, false),
      });

      expect(component.imageLoaded()).toBe(true);
    });

    it('should fallback to placeholder on image error', () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/bad.jpg';

      component.onImageError({ target: img } as unknown as Event);

      expect(component.imageLoaded()).toBe(true);
      expect(img.src).toContain('assets/placeholder-cocktail.jpg');
    });
  });
});
