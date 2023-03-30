import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookTableVolumesAtTheMiddleComponent } from './orderbook-table-volumes-at-the-middle.component';
import { ModalService } from "../../../../../shared/services/modal.service";
import { OrderbookService } from "../../../services/orderbook.service";
import { WidgetSettingsService } from "../../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { ngZorroMockComponents } from "../../../../../shared/utils/testing";

describe('OrderbookTableVolumesAtTheMiddleComponent', () => {
  let component: OrderbookTableVolumesAtTheMiddleComponent;
  let fixture: ComponentFixture<OrderbookTableVolumesAtTheMiddleComponent>;

  const modalSync = jasmine.createSpyObj('ModalService', ['openCommandModal']);
  const spyOb = jasmine.createSpyObj('OrderbookService', ['getHorizontalOrderBook', 'unsubscribe']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookTableVolumesAtTheMiddleComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        { provide: ModalService, useValue: modalSync },
        { provide: OrderbookService, useValue: spyOb },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX',
              showTable: true
            }))
          }
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderbookTableVolumesAtTheMiddleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
