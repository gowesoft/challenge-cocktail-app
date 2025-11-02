import { Cocktail, Ingredient } from '@app/models/cocktail.model';

/**
 * Utility class for cocktail-related operations
 */
export class CocktailUtils {
  /**
   * Extract ingredients with measures from a cocktail
   */
  static extractIngredients(cocktail: Cocktail): Ingredient[] {
    const ingredients: Ingredient[] = [];

    for (let i = 1; i <= 15; i++) {
      const ingredientKey = `strIngredient${i}` as keyof Cocktail;
      const measureKey = `strMeasure${i}` as keyof Cocktail;

      const ingredientName = cocktail[ingredientKey];
      const measure = cocktail[measureKey];

      if (ingredientName && ingredientName.trim() !== '') {
        ingredients.push({
          name: ingredientName.trim(),
          measure: measure ? measure.trim() : '',
        });
      }
    }

    return ingredients;
  }

  /**
   * Get the display name for a cocktail
   */
  static getDisplayName(cocktail: Cocktail): string {
    return cocktail.strDrink || 'Unknown Cocktail';
  }

  /**
   * Get the thumbnail URL for a cocktail
   */
  static getThumbnailUrl(cocktail: Cocktail): string {
    return cocktail.strDrinkThumb || 'assets/placeholder-cocktail.jpg';
  }

  /**
   * Get instructions for a cocktail (prefer English)
   */
  static getInstructions(cocktail: Cocktail): string {
    return cocktail.strInstructions || 'No instructions available.';
  }

  /**
   * Check if cocktail has minimum data
   */
  static isValidCocktail(cocktail: Cocktail): boolean {
    return !!(cocktail.idDrink && cocktail.strDrink);
  }

  /**
   * Format cocktail for display
   */
  static formatCocktail(cocktail: Cocktail) {
    return {
      ...cocktail,
      ingredients: this.extractIngredients(cocktail),
      displayName: this.getDisplayName(cocktail),
      thumbnailUrl: this.getThumbnailUrl(cocktail),
      instructions: this.getInstructions(cocktail),
    };
  }
}
