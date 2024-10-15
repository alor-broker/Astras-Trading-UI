import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { PositionsComponent } from './positions.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  of,
  Subject
} from "rxjs";
import { LetDirective } from "@ngrx/component";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('PositionsComponent', () => {
  let component: PositionsComponent;
  let fixture: ComponentFixture<PositionsComponent>;
  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        {
          provide: WsOrdersService,
          useValue: {
            submitMarketOrder: jasmine.createSpy('submitMarketOrder').and.callThrough()
          }
        },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getSpectraRisksSubscription: jasmine.createSpy('getSpectraRisksSubscription').and.returnValue(new Subject()),
            getSummariesSubscription: jasmine.createSpy('getSummariesSubscription').and.returnValue(new Subject()),
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
        ...commonTestProviders
      ],
      declarations: [
        PositionsComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-instrument-badge-display', inputs: ['columns'] }),
        ComponentHelpers.mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionsComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
