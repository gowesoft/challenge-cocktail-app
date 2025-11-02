import {
  Component,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchFilter, SearchType } from '@app/models/cocktail.model';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnDestroy {
  @Output() search = new EventEmitter<SearchFilter>();
  @Output() clearSearch = new EventEmitter<void>();

  searchTypeSignal = signal<SearchType>('name');
  searchValueSignal = signal<string>('');
  hasActiveSearch = signal<boolean>(false);

  private searchTimeout?: number;
  private isManualClear = false;

  // Computed properties
  searchPlaceholder = computed(() => {
    const type = this.searchTypeSignal();
    switch (type) {
      case 'name':
        return 'Enter cocktail name (max 50 characters)';
      case 'ingredient':
        return 'Enter ingredient name';
      case 'id':
        return 'Enter cocktail ID (numbers only)';
      default:
        return 'Search...';
    }
  });

  inputPattern = computed(() => {
    const type = this.searchTypeSignal();
    switch (type) {
      case 'name':
      case 'ingredient':
        return '[a-zA-Z\\s]*';
      case 'id':
        return '[0-9]*';
      default:
        return '.*';
    }
  });

  maxLength = computed(() => {
    return this.searchTypeSignal() === 'name' ? 50 : 999;
  });

  isValid = computed(() => {
    const value = this.searchValueSignal().trim();
    const type = this.searchTypeSignal();

    if (value.length === 0) {
      return false;
    }

    switch (type) {
      case 'name':
      case 'ingredient':
        return /^[a-zA-Z\s]+$/.test(value);
      case 'id':
        return /^[0-9]+$/.test(value);
      default:
        return false;
    }
  });

  onSearchTypeChange(): void {
    this.searchValueSignal.set('');
    this.clearDebounceTimer();
  }

  onInputChange(): void {
    // Clear any existing timeout
    this.clearDebounceTimer();

    const value = this.searchValueSignal().trim();

    // If manual clear was triggered, don't auto-search
    if (this.isManualClear) {
      this.isManualClear = false;
      return;
    }

    // If input is empty, clear search
    if (value.length === 0) {
      if (this.hasActiveSearch()) {
        this.hasActiveSearch.set(false);
        this.clearSearch.emit();
      }
      return;
    }

    // Set up debounce timer for auto-search
    if (this.isValid()) {
      this.searchTimeout = window.setTimeout(() => {
        this.performSearch();
      }, 500);
    }
  }

  private clearDebounceTimer(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = undefined;
    }
  }

  private performSearch(): void {
    if (this.isValid()) {
      const filter: SearchFilter = {
        type: this.searchTypeSignal(),
        value: this.searchValueSignal().trim(),
      };
      this.hasActiveSearch.set(true);
      this.search.emit(filter);
    }
  }

  onSearch(): void {
    // Clear any pending timeout
    this.clearDebounceTimer();
    // Perform immediate search
    this.performSearch();
  }

  onClear(): void {
    this.isManualClear = true;
    this.clearDebounceTimer();
    this.searchValueSignal.set('');

    if (this.hasActiveSearch()) {
      this.hasActiveSearch.set(false);
      this.clearSearch.emit();
    }
  }

  onClearAll(): void {
    this.isManualClear = true;
    this.clearDebounceTimer();
    this.searchValueSignal.set('');
    this.searchTypeSignal.set('name');
    this.hasActiveSearch.set(false);
    this.clearSearch.emit();
  }

  setSearchFilter(filter: SearchFilter | null): void {
    this.clearDebounceTimer();

    if (filter) {
      this.searchTypeSignal.set(filter.type);
      this.searchValueSignal.set(filter.value);
      this.hasActiveSearch.set(true);
    } else {
      this.isManualClear = true;
      this.searchTypeSignal.set('name');
      this.searchValueSignal.set('');
      this.hasActiveSearch.set(false);
    }
  }

  ngOnDestroy(): void {
    this.clearDebounceTimer();
  }
}
