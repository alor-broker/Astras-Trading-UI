import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectClientPortfolioBtnComponent } from './select-client-portfolio-btn.component';

describe('SelectClientPortfolioBtnComponent', () => {
  let component: SelectClientPortfolioBtnComponent;
  let fixture: ComponentFixture<SelectClientPortfolioBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectClientPortfolioBtnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectClientPortfolioBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
