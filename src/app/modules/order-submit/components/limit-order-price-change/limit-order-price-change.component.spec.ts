import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitOrderPriceChangeComponent } from './limit-order-price-change.component';
import { ngZorroMockComponents } from '../../../../shared/utils/testing';

describe('LimitOrderPriceChangeComponent', () => {
  let component: LimitOrderPriceChangeComponent;
  let fixture: ComponentFixture<LimitOrderPriceChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LimitOrderPriceChangeComponent,
        ...ngZorroMockComponents
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LimitOrderPriceChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
