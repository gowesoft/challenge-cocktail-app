import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cocktail-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocktail-skeleton.component.html',
  styleUrl: './cocktail-skeleton.component.scss',
})
export class CocktailSkeletonComponent {
  @Input() count: number = 6;

  get skeletonArray(): number[] {
    return Array(this.count).fill(0);
  }
}
