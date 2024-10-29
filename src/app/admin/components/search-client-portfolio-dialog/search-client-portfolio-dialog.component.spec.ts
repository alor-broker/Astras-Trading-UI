import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchClientPortfolioDialogComponent } from './search-client-portfolio-dialog.component';

describe('SearchClientPortfolioDialogComponent', () => {
  let component: SearchClientPortfolioDialogComponent;
  let fixture: ComponentFixture<SearchClientPortfolioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchClientPortfolioDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchClientPortfolioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
