import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { OrderbookService } from '../../services/orderbook.service';

import { OrderBookComponent } from './order-book.component';

describe('OrderBookComponent', () => {
  let component: OrderBookComponent;
  let fixture: ComponentFixture<OrderBookComponent>;
  const spyOb = jasmine.createSpyObj('OrderbookService', ['settings$']);
  spyOb.settings$ = of({
    symbol: 'SBER',
    exchange: 'MOEX'
  })
  const spySync = jasmine.createSpyObj('SyncService', ['openCommandModal'])

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderBookComponent ],
      providers: [
        { provide: OrderbookService, useValue: spyOb },
        { provide: SyncService, useValue: spySync },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderBookComponent);
    component = fixture.componentInstance;
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
