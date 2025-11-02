import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CocktailSkeletonComponent } from './cocktail-skeleton.component';

describe('CocktailSkeletonComponent', () => {
  let component: CocktailSkeletonComponent;
  let fixture: ComponentFixture<CocktailSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocktailSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render skeleton structure', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonCards = compiled.querySelectorAll('.skeleton-card');

    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('should have skeleton image element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonImage = compiled.querySelector('.skeleton-image');

    expect(skeletonImage).toBeTruthy();
  });

  it('should have skeleton title element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonTitle = compiled.querySelector('.skeleton-title');

    expect(skeletonTitle).toBeTruthy();
  });

  it('should have skeleton text elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonTexts = compiled.querySelectorAll('.skeleton-text');

    expect(skeletonTexts.length).toBeGreaterThan(0);
  });
});
