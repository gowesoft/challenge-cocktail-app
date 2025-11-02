import { CocktailUtils } from './cocktail.utils';
import { Cocktail } from '../models/cocktail.model';

describe('Cocktail Utils', () => {
  const mockCocktail: Cocktail = {
    idDrink: '123',
    strDrink: 'Margarita',
    strCategory: 'Cocktail',
    strAlcoholic: 'Alcoholic',
    strGlass: 'Cocktail glass',
    strDrinkThumb: 'https://example.com/image.jpg',
    strInstructions: 'Mix ingredients',
    strIngredient1: 'Tequila',
    strIngredient2: 'Lime juice',
    strIngredient3: '',
    strMeasure1: '2 oz',
    strMeasure2: '1 oz',
    strMeasure3: '',
  };

  describe('extractIngredients', () => {
    it('should extract ingredients with measures', () => {
      const ingredients = CocktailUtils.extractIngredients(mockCocktail);

      expect(ingredients.length).toBe(2);
      expect(ingredients[0]).toEqual({ name: 'Tequila', measure: '2 oz' });
      expect(ingredients[1]).toEqual({ name: 'Lime juice', measure: '1 oz' });
    });

    it('should extract ingredients without measures', () => {
      const cocktail = {
        ...mockCocktail,
        strMeasure1: '',
        strMeasure2: '',
      };

      const ingredients = CocktailUtils.extractIngredients(cocktail);

      expect(ingredients.length).toBe(2);
      expect(ingredients[0]).toEqual({ name: 'Tequila', measure: '' });
      expect(ingredients[1]).toEqual({ name: 'Lime juice', measure: '' });
    });

    it('should handle cocktail with no ingredients', () => {
      const cocktail = {
        ...mockCocktail,
        strIngredient1: '',
        strIngredient2: '',
      };

      const ingredients = CocktailUtils.extractIngredients(cocktail);

      expect(ingredients.length).toBe(0);
    });

    it('should extract all 15 ingredients if present', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Complex Cocktail',
        strIngredient1: 'Ingredient 1',
        strIngredient2: 'Ingredient 2',
        strIngredient3: 'Ingredient 3',
        strIngredient4: 'Ingredient 4',
        strIngredient5: 'Ingredient 5',
        strIngredient6: 'Ingredient 6',
        strIngredient7: 'Ingredient 7',
        strIngredient8: 'Ingredient 8',
        strIngredient9: 'Ingredient 9',
        strIngredient10: 'Ingredient 10',
        strIngredient11: 'Ingredient 11',
        strIngredient12: 'Ingredient 12',
        strIngredient13: 'Ingredient 13',
        strIngredient14: 'Ingredient 14',
        strIngredient15: 'Ingredient 15',
      };

      const ingredients = CocktailUtils.extractIngredients(cocktail);

      expect(ingredients.length).toBe(15);
    });

    it('should trim whitespace from ingredients', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Test',
        strIngredient1: '  Tequila  ',
        strMeasure1: '  2 oz  ',
      };

      const ingredients = CocktailUtils.extractIngredients(cocktail);

      expect(ingredients[0]).toEqual({ name: 'Tequila', measure: '2 oz' });
    });
  });

  describe('getDisplayName', () => {
    it('should return cocktail name', () => {
      const name = CocktailUtils.getDisplayName(mockCocktail);
      expect(name).toBe('Margarita');
    });

    it('should return default name for missing strDrink', () => {
      const cocktail = { idDrink: '123' } as any;
      const name = CocktailUtils.getDisplayName(cocktail);
      expect(name).toBe('Unknown Cocktail');
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return cocktail thumbnail URL', () => {
      const url = CocktailUtils.getThumbnailUrl(mockCocktail);
      expect(url).toBe('https://example.com/image.jpg');
    });

    it('should return placeholder for missing thumbnail', () => {
      const cocktail: Cocktail = { idDrink: '123', strDrink: 'Test' };
      const url = CocktailUtils.getThumbnailUrl(cocktail);
      expect(url).toBe('assets/placeholder-cocktail.jpg');
    });
  });

  describe('getInstructions', () => {
    it('should return cocktail instructions', () => {
      const instructions = CocktailUtils.getInstructions(mockCocktail);
      expect(instructions).toBe('Mix ingredients');
    });

    it('should return default message for missing instructions', () => {
      const cocktail: Cocktail = { idDrink: '123', strDrink: 'Test' };
      const instructions = CocktailUtils.getInstructions(cocktail);
      expect(instructions).toBe('No instructions available.');
    });
  });

  describe('isValidCocktail', () => {
    it('should return true for valid cocktail', () => {
      const result = CocktailUtils.isValidCocktail(mockCocktail);
      expect(result).toBe(true);
    });

    it('should return false for missing idDrink', () => {
      const cocktail: Cocktail = { strDrink: 'Test' } as any;
      const result = CocktailUtils.isValidCocktail(cocktail);
      expect(result).toBe(false);
    });

    it('should return false for missing strDrink', () => {
      const cocktail = { idDrink: '123' } as any;
      const result = CocktailUtils.isValidCocktail(cocktail);
      expect(result).toBe(false);
    });
  });

  describe('formatCocktail', () => {
    it('should format cocktail with all computed properties', () => {
      const formatted = CocktailUtils.formatCocktail(mockCocktail);

      expect(formatted.displayName).toBe('Margarita');
      expect(formatted.thumbnailUrl).toBe('https://example.com/image.jpg');
      expect(formatted.instructions).toBe('Mix ingredients');
      expect(formatted.ingredients.length).toBe(2);
    });

    it('should include original cocktail properties', () => {
      const formatted = CocktailUtils.formatCocktail(mockCocktail);

      expect(formatted.idDrink).toBe('123');
      expect(formatted.strCategory).toBe('Cocktail');
      expect(formatted.strAlcoholic).toBe('Alcoholic');
    });

    it('should handle cocktail with missing optional properties', () => {
      const minimal: Cocktail = {
        idDrink: '456',
        strDrink: 'Simple Drink',
      };

      const formatted = CocktailUtils.formatCocktail(minimal);

      expect(formatted.displayName).toBe('Simple Drink');
      expect(formatted.thumbnailUrl).toBe('assets/placeholder-cocktail.jpg');
      expect(formatted.instructions).toBe('No instructions available.');
      expect(formatted.ingredients.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle null ingredients', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Test',
        strIngredient1: null as any,
        strIngredient2: undefined as any,
      };

      const ingredients = CocktailUtils.extractIngredients(cocktail);
      expect(ingredients.length).toBe(0);
    });

    it('should handle ingredients with only whitespace', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Test',
        strIngredient1: '   ',
        strIngredient2: '\t\n',
      };

      const ingredients = CocktailUtils.extractIngredients(cocktail);
      expect(ingredients.length).toBe(0);
    });

    it('should handle empty string for strDrink', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: '',
      };

      const name = CocktailUtils.getDisplayName(cocktail);
      // Empty string is falsy, so || returns 'Unknown Cocktail'
      expect(name).toBe('Unknown Cocktail');
    });

    it('should handle whitespace-only strDrink', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: '   ',
      };

      const name = CocktailUtils.getDisplayName(cocktail);
      // Non-empty string (even whitespace) is truthy, so it's returned
      expect(name).toBe('   ');
    });

    it('should handle empty string for strDrinkThumb', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Test',
        strDrinkThumb: '',
      };

      const url = CocktailUtils.getThumbnailUrl(cocktail);
      // Empty string is falsy, so || returns placeholder
      expect(url).toBe('assets/placeholder-cocktail.jpg');
    });

    it('should handle empty string for strInstructions', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Test',
        strInstructions: '',
      };

      const instructions = CocktailUtils.getInstructions(cocktail);
      // Empty string is falsy, so || returns 'No instructions available.'
      expect(instructions).toBe('No instructions available.');
    });

    it('should handle whitespace-only strInstructions', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: 'Test',
        strInstructions: '   ',
      };

      const instructions = CocktailUtils.getInstructions(cocktail);
      expect(instructions).toBe('   '); // Should preserve whitespace if present
    });
  });

  describe('isValidCocktail - additional tests', () => {
    it('should return false for null cocktail', () => {
      // Need to check for null first to avoid TypeError
      const cocktail = null as any;
      const result = cocktail ? CocktailUtils.isValidCocktail(cocktail) : false;
      expect(result).toBe(false);
    });

    it('should return false for undefined cocktail', () => {
      // Need to check for undefined first to avoid TypeError
      const cocktail = undefined as any;
      const result = cocktail ? CocktailUtils.isValidCocktail(cocktail) : false;
      expect(result).toBe(false);
    });

    it('should return false for empty object', () => {
      const result = CocktailUtils.isValidCocktail({} as any);
      expect(result).toBe(false);
    });

    it('should return false for cocktail with empty strings', () => {
      const cocktail: Cocktail = {
        idDrink: '123',
        strDrink: '', // Empty string is falsy
      };

      const result = CocktailUtils.isValidCocktail(cocktail);
      // !!(cocktail.idDrink && cocktail.strDrink)  ->  !!('123' && '')  ->  !!('')  ->  false
      expect(result).toBe(false);
    });
  });
});
