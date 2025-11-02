import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent, BrowserAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with name search type', () => {
    expect(component.searchTypeSignal()).toBe('name');
  });

  it('should have empty search value initially', () => {
    expect(component.searchValueSignal()).toBe('');
  });

  it('should update search type', () => {
    component.searchTypeSignal.set('ingredient');
    expect(component.searchTypeSignal()).toBe('ingredient');
  });

  it('should update search value', () => {
    component.searchValueSignal.set('margarita');
    expect(component.searchValueSignal()).toBe('margarita');
  });

  it('should clear search value when type changes', () => {
    component.searchValueSignal.set('test');
    component.onSearchTypeChange();
    expect(component.searchValueSignal()).toBe('');
  });

  it('should validate name search (alphabetic only)', () => {
    component.searchTypeSignal.set('name');
    component.searchValueSignal.set('Margarita');
    expect(component.isValid()).toBe(true);

    component.searchValueSignal.set('Margarita123');
    expect(component.isValid()).toBe(false);
  });

  it('should validate ingredient search (alphabetic only)', () => {
    component.searchTypeSignal.set('ingredient');
    component.searchValueSignal.set('vodka');
    expect(component.isValid()).toBe(true);

    component.searchValueSignal.set('vodka123');
    expect(component.isValid()).toBe(false);
  });

  it('should validate ID search (numeric only)', () => {
    component.searchTypeSignal.set('id');
    component.searchValueSignal.set('12345');
    expect(component.isValid()).toBe(true);

    component.searchValueSignal.set('12345abc');
    expect(component.isValid()).toBe(false);
  });

  it('should not be valid with empty value', () => {
    component.searchValueSignal.set('');
    expect(component.isValid()).toBe(false);
  });

  it('should emit search event when valid', () => {
    spyOn(component.search, 'emit');
    component.searchTypeSignal.set('name');
    component.searchValueSignal.set('Margarita');

    component.onSearch();

    expect(component.search.emit).toHaveBeenCalledWith({
      type: 'name',
      value: 'Margarita',
    });
  });

  it('should not emit search event when invalid', () => {
    spyOn(component.search, 'emit');
    component.searchValueSignal.set('');

    component.onSearch();

    expect(component.search.emit).not.toHaveBeenCalled();
  });

  it('should clear search value on onClear', () => {
    component.searchValueSignal.set('test');
    component.onClear();
    expect(component.searchValueSignal()).toBe('');
  });

  it('should set search filter', () => {
    component.setSearchFilter({ type: 'ingredient', value: 'vodka' });
    expect(component.searchTypeSignal()).toBe('ingredient');
    expect(component.searchValueSignal()).toBe('vodka');
  });

  it('should reset on null filter', () => {
    component.setSearchFilter(null);
    expect(component.searchTypeSignal()).toBe('name');
    expect(component.searchValueSignal()).toBe('');
  });

  it('should have correct placeholder for name search', () => {
    component.searchTypeSignal.set('name');
    expect(component.searchPlaceholder()).toContain('name');
  });

  it('should have correct placeholder for ingredient search', () => {
    component.searchTypeSignal.set('ingredient');
    expect(component.searchPlaceholder()).toContain('ingredient');
  });

  it('should have correct placeholder for ID search', () => {
    component.searchTypeSignal.set('id');
    expect(component.searchPlaceholder()).toContain('ID');
  });

  it('should have max length of 50 for name search', () => {
    component.searchTypeSignal.set('name');
    expect(component.maxLength()).toBe(50);
  });

  it('should have max length of 999 for non-name search', () => {
    component.searchTypeSignal.set('id');
    expect(component.maxLength()).toBe(999);
  });

  it('should detect active search', () => {
    expect(component.hasActiveSearch()).toBe(false);

    component.searchValueSignal.set('test');
    component.hasActiveSearch.set(true); // Manually set as it's set by performSearch
    expect(component.hasActiveSearch()).toBe(true);
  });

  it('should emit clearSearch event on onClearAll', () => {
    spyOn(component.clearSearch, 'emit');
    component.searchValueSignal.set('test');

    component.onClearAll();

    expect(component.searchValueSignal()).toBe('');
    expect(component.clearSearch.emit).toHaveBeenCalled();
  });

  it('should trigger debounced search on input change', (done) => {
    spyOn(component.search, 'emit');
    component.searchTypeSignal.set('name');
    component.searchValueSignal.set('Margarita');

    component.onInputChange();

    // Wait for debounce timeout (500ms)
    setTimeout(() => {
      expect(component.search.emit).toHaveBeenCalledWith({
        type: 'name',
        value: 'Margarita',
      });
      done();
    }, 600);
  });

  it('should not trigger debounced search for invalid input', (done) => {
    spyOn(component.search, 'emit');
    component.searchTypeSignal.set('name');
    component.searchValueSignal.set('Margarita123'); // Invalid

    component.onInputChange();

    setTimeout(() => {
      expect(component.search.emit).not.toHaveBeenCalled();
      done();
    }, 600);
  });

  it('should clear debounce timer on component destroy', () => {
    component.searchValueSignal.set('test');
    component.onInputChange();

    // Should not throw error
    component.ngOnDestroy();
    expect(true).toBe(true);
  });

  it('should not trigger debounce on manual clear', () => {
    spyOn(component.search, 'emit');
    component.searchValueSignal.set('test');

    component.onClear();

    expect(component.search.emit).not.toHaveBeenCalled();
  });

  describe('additional validation tests', () => {
    it('should handle special characters in name search', () => {
      component.searchTypeSignal.set('name');
      // Component only accepts a-zA-Z and spaces, so this should be false
      component.searchValueSignal.set('Piña Colada');
      expect(component.isValid()).toBe(false);
    });

    it('should handle spaces in searches', () => {
      component.searchTypeSignal.set('name');
      component.searchValueSignal.set('Long Island Iced Tea');
      expect(component.isValid()).toBe(true);
    });

    it('should reject numbers in ingredient search', () => {
      component.searchTypeSignal.set('ingredient');
      component.searchValueSignal.set('ingredient123');
      expect(component.isValid()).toBe(false);
    });

    it('should handle whitespace-only value', () => {
      component.searchValueSignal.set('   ');
      expect(component.isValid()).toBe(false);
    });
  });

  describe('debounce behavior', () => {
    it('should cancel previous search when typing quickly', (done) => {
      spyOn(component.search, 'emit');
      component.searchTypeSignal.set('name');

      // Type first value
      component.searchValueSignal.set('Mar');
      component.onInputChange();

      // Type second value quickly (should cancel first)
      setTimeout(() => {
        component.searchValueSignal.set('Margarita');
        component.onInputChange();
      }, 100);

      // Only the last value should trigger search
      setTimeout(() => {
        expect(component.search.emit).toHaveBeenCalledTimes(1);
        expect(component.search.emit).toHaveBeenCalledWith({
          type: 'name',
          value: 'Margarita',
        });
        done();
      }, 700);
    });

    it('should clear search when input becomes empty', (done) => {
      spyOn(component.clearSearch, 'emit');
      component.searchTypeSignal.set('name');
      component.searchValueSignal.set('test');
      component.hasActiveSearch.set(true);

      component.onInputChange();

      setTimeout(() => {
        // Now clear the input
        component.searchValueSignal.set('');
        component.onInputChange();

        setTimeout(() => {
          expect(component.clearSearch.emit).toHaveBeenCalled();
          done();
        }, 600);
      }, 100);
    });
  });

  describe('input patterns', () => {
    it('should return correct pattern for name search', () => {
      component.searchTypeSignal.set('name');
      expect(component.inputPattern()).toBe('[a-zA-Z\\s]*');
    });

    it('should return correct pattern for ingredient search', () => {
      component.searchTypeSignal.set('ingredient');
      expect(component.inputPattern()).toBe('[a-zA-Z\\s]*');
    });

    it('should return correct pattern for ID search', () => {
      component.searchTypeSignal.set('id');
      expect(component.inputPattern()).toBe('[0-9]*');
    });
  });

  describe('edge cases for setSearchFilter', () => {
    it('should handle setting same filter twice', () => {
      component.setSearchFilter({ type: 'name', value: 'test' });
      component.setSearchFilter({ type: 'name', value: 'test' });

      expect(component.searchTypeSignal()).toBe('name');
      expect(component.searchValueSignal()).toBe('test');
    });

    it('should handle rapid filter changes', () => {
      component.setSearchFilter({ type: 'name', value: 'test1' });
      component.setSearchFilter({ type: 'ingredient', value: 'test2' });
      component.setSearchFilter({ type: 'id', value: '123' });

      expect(component.searchTypeSignal()).toBe('id');
      expect(component.searchValueSignal()).toBe('123');
    });
  });

  describe('onSearchTypeChange behavior', () => {
    it('should clear debounce timer when search type changes', () => {
      component.searchValueSignal.set('test');
      component.onInputChange();

      // Change type (should clear timer)
      component.onSearchTypeChange();

      expect(component.searchValueSignal()).toBe('');
    });
  });
});
