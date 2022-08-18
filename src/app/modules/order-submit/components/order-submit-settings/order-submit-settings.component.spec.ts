import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderSubmitSettingsComponent } from './order-submit-settings.component';

describe('OrderSubmitSettingsComponent', () => {
  let component: OrderSubmitSettingsComponent;
  let fixture: ComponentFixture<OrderSubmitSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderSubmitSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
