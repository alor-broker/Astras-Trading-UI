import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookComponent } from './scalper-order-book.component';
import { of } from "rxjs";
import { OrderbookService } from "../../services/orderbook.service";
import { ScalperOrderBook } from "../../models/scalper-order-book.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { OrderbookHotKeysService } from "../../../../shared/services/orderbook-hot-keys.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { CurrentPortfolioOrderService } from "../../../../shared/services/orders/current-portfolio-order.service";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScalperOrderBookComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER', exchange: 'MOEX', showTable: true
            }))
          }
        },
        {
          provide: OrderbookService,
          useValue: {
            getVerticalOrderBook: jasmine.createSpy('getVerticalOrderBook').and.returnValue(of({
              asks: [],
              bids: [],
              spreadItems: []
            } as ScalperOrderBook))
          }
        },
        {
          provide: InstrumentsService,
          useValue: { getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({})) }
        },
        {
          provide: OrderbookHotKeysService,
          useValue: {
            orderBookEventSub: of({}),
            activeOrderbookChange: jasmine.createSpy('activeOrderbookChange')
          }
        },
        {
          provide: CurrentPortfolioOrderService,
          useValue: {
            submitMarketOrder: jasmine.createSpy('submitMarketOrder').and.returnValue(of({})),
            submitLimitOrder: jasmine.createSpy('submitLimitOrder').and.returnValue(of({})),
            submitStopLimitOrder: jasmine.createSpy('submitStopLimitOrder').and.returnValue(of({})),
            submitStopMarketOrder: jasmine.createSpy('submitStopMarketOrder').and.returnValue(of({})),
          }
        },
        {
          provide: NzNotificationService,
          useValue: {
            error: jasmine.createSpy('error')
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        {
          provide: ModalService,
          useValue:  jasmine.createSpy('openCommandModal').and.callThrough()
        },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
