import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceTickComponent } from './price-tick.component';

describe('PriceTickComponent', () => {
  let component: PriceTickComponent;
  let fixture: ComponentFixture<PriceTickComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PriceTickComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceTickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
