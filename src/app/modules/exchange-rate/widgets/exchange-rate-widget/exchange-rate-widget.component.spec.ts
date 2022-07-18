import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeRateWidgetComponent } from './exchange-rate-widget.component';

describe('ExchangeRateWidgetComponent', () => {
  let component: ExchangeRateWidgetComponent;
  let fixture: ComponentFixture<ExchangeRateWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExchangeRateWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangeRateWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
