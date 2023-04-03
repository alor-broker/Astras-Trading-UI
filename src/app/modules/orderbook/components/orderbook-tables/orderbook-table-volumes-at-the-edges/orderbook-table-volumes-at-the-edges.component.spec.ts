import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookTableVolumesAtTheEdgesComponent } from './orderbook-table-volumes-at-the-edges.component';
import { ModalService } from "../../../../../shared/services/modal.service";
import { WidgetSettingsService } from "../../../../../shared/services/widget-settings.service";
import {
  of,
  Subject
} from "rxjs";
import { OrderbookService } from "../../../services/orderbook.service";
import { ngZorroMockComponents } from "../../../../../shared/utils/testing";
import { InstrumentsService } from '../../../../instruments/services/instruments.service';
import { ThemeService } from '../../../../../shared/services/theme.service';

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
          provide: InstrumentsService,
          useValue: { getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({})) }
        },
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
        { provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
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
