import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Cocktail, CocktailApiResponse } from '../models/cocktail.model';

@Injectable({
  providedIn: 'root',
})
export class CocktailApiService {
  private readonly API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

  constructor(private http: HttpClient) {}

  /**
   * Search cocktails by name
   */
  searchByName(name: string): Observable<Cocktail[]> {
    if (!name || name.trim().length === 0) {
      return of([]);
    }

    return this.http
      .get<CocktailApiResponse>(`${this.API_BASE_URL}/search.php?s=${encodeURIComponent(name)}`)
      .pipe(
        map((response) => response.drinks || []),
        catchError(() => of([]))
      );
  }

  /**
   * Search cocktails by ingredient
   */
  searchByIngredient(ingredient: string): Observable<Cocktail[]> {
    if (!ingredient || ingredient.trim().length === 0) {
      return of([]);
    }

    return this.http
      .get<CocktailApiResponse>(
        `${this.API_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
      )
      .pipe(
        map((response) => response.drinks || []),
        catchError(() => of([]))
      );
  }

  /**
   * Search cocktail by ID
   */
  searchById(id: string): Observable<Cocktail | null> {
    if (!id || id.trim().length === 0) {
      return of(null);
    }

    return this.http
      .get<CocktailApiResponse>(`${this.API_BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`)
      .pipe(
        map((response) => (response.drinks ? response.drinks[0] : null)),
        catchError(() => of(null))
      );
  }

  /**
   * Get full cocktail details by ID
   */
  getCocktailDetails(id: string): Observable<Cocktail | null> {
    return this.searchById(id);
  }

  /**
   * Get random cocktails
   */
  getRandomCocktails(count: number = 10): Observable<Cocktail[]> {
    const requests: Observable<Cocktail | null>[] = [];

    for (let i = 0; i < count; i++) {
      requests.push(
        this.http.get<CocktailApiResponse>(`${this.API_BASE_URL}/random.php`).pipe(
          map((response) => (response.drinks ? response.drinks[0] : null)),
          catchError(() => of(null))
        )
      );
    }

    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise())).then((results) => {
        const cocktails = results.filter((c): c is Cocktail => c !== null);
        observer.next(cocktails);
        observer.complete();
      });
    });
  }
}
