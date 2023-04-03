import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookTableVolumesAtTheEdgesComponent } from './orderbook-table-volumes-at-the-edges.component';
import { ModalService } from "../../../../../shared/services/modal.service";
import { WidgetSettingsService } from "../../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { OrderbookService } from "../../../services/orderbook.service";
import { ngZorroMockComponents } from "../../../../../shared/utils/testing";

describe('OrderbookTableVolumesAtTheEdgesComponent', () => {
  let component: OrderbookTableVolumesAtTheEdgesComponent;
  let fixture: ComponentFixture<OrderbookTableVolumesAtTheEdgesComponent>;

  const modalSync = jasmine.createSpyObj('ModalService', ['openCommandModal']);
  const spyOb = jasmine.createSpyObj('OrderbookService', ['getHorizontalOrderBook', 'unsubscribe']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookTableVolumesAtTheEdgesComponent,
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

    fixture = TestBed.createComponent(OrderbookTableVolumesAtTheEdgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
