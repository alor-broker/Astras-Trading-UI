import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { VerticalOrderBookComponent } from './vertical-order-book.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { OrderbookService } from "../../services/orderbook.service";
import { VerticalOrderBook } from "../../models/vertical-order-book.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";

describe('VerticalOrderBookComponent', () => {
  let component: VerticalOrderBookComponent;
  let fixture: ComponentFixture<VerticalOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerticalOrderBookComponent], providers: [{
        provide: WidgetSettingsService, useValue: {
          getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
            symbol: 'SBER', exchange: 'MOEX', showTable: true
          }))
        }
      }, {
        provide: OrderbookService,
        useValue: {
          getVerticalOrderBook: jasmine.createSpy('getVerticalOrderBook').and.returnValue(of({
            asks: [],
            bids: []
          } as VerticalOrderBook))
        }
      },
        {
          provide: InstrumentsService,
          useValue: { getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({})) }
        },],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticalOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
