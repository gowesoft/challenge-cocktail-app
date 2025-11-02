import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Cocktail } from '../../models/cocktail.model';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-cocktail-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './cocktail-card.component.html',
  styleUrls: ['./cocktail-card.component.scss'],
})
export class CocktailCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) cocktail!: Cocktail;
  @Output() viewDetails = new EventEmitter<string>();
  @Output() toggleFavorite = new EventEmitter<string>();

  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;

  constructor(private router: Router, private favoritesService: FavoritesService) {}

  isFavorite = signal<boolean>(false);
  imageLoaded = signal<boolean>(false);
  private lastImageUrl: string | null = null;

  ngOnInit(): void {
    this.updateFavoriteStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cocktail']) {
      this.updateFavoriteStatus();

      const nextUrl = this.cocktail?.strDrinkThumb || null;
      if (nextUrl !== this.lastImageUrl) {
        this.imageLoaded.set(false);
      }
    }
  }

  private updateFavoriteStatus(): void {
    if (this.cocktail) {
      this.isFavorite.set(this.favoritesService.isFavorite(this.cocktail.idDrink));
    }
  }

  onImageLoad(event: Event): void {
    if (event && event.target instanceof HTMLImageElement) {
      this.lastImageUrl = event.target.currentSrc || event.target.src;
    }
    this.imageLoaded.set(true);
  }

  onImageError(event: Event): void {
    if (event && event.target instanceof HTMLImageElement) {
      event.target.src = 'assets/placeholder-cocktail.jpg';
      this.lastImageUrl = event.target.src;
    }
    this.imageLoaded.set(true);
  }

  onViewDetails(): void {
    // Emit event to parent component to handle navigation
    // This ensures scroll position is saved before navigating
    this.viewDetails.emit(this.cocktail.idDrink);
  }

  onToggleFavorite(): void {
    this.favoritesService.toggleFavorite(this.cocktail.idDrink);
    this.updateFavoriteStatus();
  }

  openContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.openMenu();
  }
}
