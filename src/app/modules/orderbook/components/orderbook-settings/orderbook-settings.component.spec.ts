import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookSettingsComponent } from './orderbook-settings.component';
import { of } from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';

describe('OrderbookSettingsComponent', () => {
  let component: OrderbookSettingsComponent;
  let fixture: ComponentFixture<OrderbookSettingsComponent>;
  const spy = jasmine.createSpyObj('OrderbookService', ['getSettings']);
  spy.getSettings.and.returnValue(of({
    symbol: 'SBER',
    exchange: 'MOEX'
  }));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderbookSettingsComponent],
      providers: [
        { provide: OrderbookService, useValue: spy }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
