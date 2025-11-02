import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CocktailApiService } from './cocktail-api.service';
import { Cocktail } from '../models/cocktail.model';

describe('CocktailApiService', () => {
  let service: CocktailApiService;
  let httpMock: HttpTestingController;
  const API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CocktailApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CocktailApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchByName', () => {
    it('should return cocktails when searching by name', (done) => {
      const mockResponse = {
        drinks: [
          { idDrink: '1', strDrink: 'Margarita' } as Cocktail,
          { idDrink: '2', strDrink: 'Mojito' } as Cocktail,
        ],
      };

      service.searchByName('mar').subscribe((cocktails) => {
        expect(cocktails.length).toBe(2);
        expect(cocktails[0].strDrink).toBe('Margarita');
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/search.php?s=mar`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when name is empty', (done) => {
      service.searchByName('').subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });
    });

    it('should handle null response', (done) => {
      const mockResponse = { drinks: null };

      service.searchByName('nonexistent').subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/search.php?s=nonexistent`);
      req.flush(mockResponse);
    });

    it('should handle errors gracefully', (done) => {
      service.searchByName('error').subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/search.php?s=error`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('searchByIngredient', () => {
    it('should return cocktails when searching by ingredient', (done) => {
      const mockResponse = {
        drinks: [{ idDrink: '1', strDrink: 'Cocktail 1' } as Cocktail],
      };

      service.searchByIngredient('vodka').subscribe((cocktails) => {
        expect(cocktails.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/filter.php?i=vodka`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when ingredient is empty', (done) => {
      service.searchByIngredient('').subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });
    });
  });

  describe('searchById', () => {
    it('should return a cocktail when searching by ID', (done) => {
      const mockResponse = {
        drinks: [{ idDrink: '11007', strDrink: 'Margarita' } as Cocktail],
      };

      service.searchById('11007').subscribe((cocktail) => {
        expect(cocktail).toBeTruthy();
        expect(cocktail?.idDrink).toBe('11007');
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=11007`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when ID is empty', (done) => {
      service.searchById('').subscribe((cocktail) => {
        expect(cocktail).toBeNull();
        done();
      });
    });

    it('should return null when cocktail not found', (done) => {
      const mockResponse = { drinks: null };

      service.searchById('99999').subscribe((cocktail) => {
        expect(cocktail).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=99999`);
      req.flush(mockResponse);
    });
  });

  describe('getCocktailDetails', () => {
    it('should return cocktail details', (done) => {
      const mockResponse = {
        drinks: [{ idDrink: '11007', strDrink: 'Margarita' } as Cocktail],
      };

      service.getCocktailDetails('11007').subscribe((cocktail) => {
        expect(cocktail).toBeTruthy();
        expect(cocktail?.strDrink).toBe('Margarita');
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=11007`);
      req.flush(mockResponse);
    });

    it('should return null when no cocktail found', (done) => {
      const mockResponse = { drinks: null };

      service.getCocktailDetails('99999').subscribe((cocktail) => {
        expect(cocktail).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=99999`);
      req.flush(mockResponse);
    });

    it('should handle errors gracefully', (done) => {
      service.getCocktailDetails('error').subscribe((cocktail) => {
        expect(cocktail).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=error`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('searchByIngredient - additional tests', () => {
    it('should handle null response', (done) => {
      const mockResponse = { drinks: null };

      service.searchByIngredient('unknown').subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/filter.php?i=unknown`);
      req.flush(mockResponse);
    });

    it('should handle errors gracefully', (done) => {
      service.searchByIngredient('error').subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/filter.php?i=error`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('searchById - additional tests', () => {
    it('should handle errors gracefully', (done) => {
      service.searchById('error').subscribe((cocktail) => {
        expect(cocktail).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=error`);
      req.error(new ProgressEvent('error'));
    });

    it('should handle empty drinks array', (done) => {
      const mockResponse = { drinks: [] };

      service.searchById('123').subscribe((cocktail) => {
        expect(cocktail).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/lookup.php?i=123`);
      req.flush(mockResponse);
    });
  });

  describe('getRandomCocktails', () => {
    it('should return multiple random cocktails', (done) => {
      const mockCocktail = { idDrink: '1', strDrink: 'Random Cocktail' } as Cocktail;
      const mockResponse = { drinks: [mockCocktail] };

      service.getRandomCocktails(3).subscribe((cocktails) => {
        expect(cocktails.length).toBe(3);
        done();
      });

      // Should make 3 requests - use match() instead of expectOne()
      const requests = httpMock.match(`${API_BASE_URL}/random.php`);
      expect(requests.length).toBe(3);
      requests.forEach((req) => req.flush(mockResponse));
    });

    it('should handle errors and return empty array for failed requests', (done) => {
      const mockCocktail = { idDrink: '1', strDrink: 'Random Cocktail' } as Cocktail;
      const mockResponse = { drinks: [mockCocktail] };

      service.getRandomCocktails(2).subscribe((cocktails) => {
        // Should only return 1 cocktail (the successful one)
        expect(cocktails.length).toBe(1);
        done();
      });

      // Use match() for multiple requests
      const requests = httpMock.match(`${API_BASE_URL}/random.php`);
      expect(requests.length).toBe(2);

      // First request succeeds
      requests[0].flush(mockResponse);

      // Second request fails
      requests[1].error(new ProgressEvent('error'));
    });

    it('should handle null response from API', (done) => {
      const mockResponse = { drinks: null };

      service.getRandomCocktails(1).subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/random.php`);
      req.flush(mockResponse);
    });

    it('should return empty array when count is 0', (done) => {
      service.getRandomCocktails(0).subscribe((cocktails) => {
        expect(cocktails.length).toBe(0);
        done();
      });
    });
  });
});
