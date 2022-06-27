import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { sharedModuleImportForTests } from 'src/app/shared/utils/testing';
import { OrderBook } from '../../models/orderbook.model';
import { OrderbookService } from '../../services/orderbook.service';

import { OrderBookComponent } from './orderbook.component';

describe('OrderBookComponent', () => {
  let component: OrderBookComponent;
  let fixture: ComponentFixture<OrderBookComponent>;
  const spyOb = jasmine.createSpyObj('OrderbookService', ['settings$', 'getOrderbook', 'unsubscribe', 'getSettings']);
  spyOb.getSettings.and.returnValue(of({
    symbol: 'SBER',
    exchange: 'MOEX',
    showTable: true
  }));
  const ob: OrderBook = {
    rows: [],
    maxVolume: 10,
    chartData: {
      asks: [],
      bids: [],
      minPrice: 0,
      maxPrice: 0
    }
  };
  spyOb.getOrderbook.and.returnValue(of(ob));
  const modalSync = jasmine.createSpyObj('ModalService', ['openCommandModal']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderBookComponent],
      providers: [
        { provide: OrderbookService, useValue: spyOb },
        { provide: ModalService, useValue: modalSync },
      ],
      imports: [
        ...sharedModuleImportForTests
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderBookComponent);
    component = fixture.componentInstance;
    const spy = jasmine.createSpyObj('resize', ['pipe']);
    spy.pipe.and.returnValue(new Subject());
    component.resize = spy;
    fixture.detectChanges();
  });
  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
