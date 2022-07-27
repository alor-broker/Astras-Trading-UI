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
import { CommandsService } from "../../../command/services/commands.service";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookComponent,
        ...ngZorroMockComponents
      ],
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
          provide: CommandsService,
          useValue: {
            setStopCommand: jasmine.createSpy('setStopCommand'),
            submitStop: jasmine.createSpy('submitStop').and.returnValue(of({})),
            setLimitCommand: jasmine.createSpy('setLimitCommand'),
            submitLimit: jasmine.createSpy('submitLimit').and.returnValue(of({})),
            setMarketCommand: jasmine.createSpy('setMarketCommand'),
            submitMarket: jasmine.createSpy('submitMarket').and.returnValue(of({})),
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
