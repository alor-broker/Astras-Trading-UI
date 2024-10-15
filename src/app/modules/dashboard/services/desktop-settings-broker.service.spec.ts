import { TestBed } from '@angular/core/testing';

import { DesktopSettingsBrokerService } from './desktop-settings-broker.service';
import {
  DashboardSettingsBrokerService
} from "../../../shared/services/settings-broker/dashboard-settings-broker.service";
import {
  EMPTY,
  Subject
} from "rxjs";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {WidgetsSettingsBrokerService} from "../../../shared/services/settings-broker/widgets-settings-broker.service";
import {WidgetSettingsService} from "../../../shared/services/widget-settings.service";
import {TerminalSettingsBrokerService} from "../../../shared/services/settings-broker/terminal-settings-broker.service";
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";
import { GlobalLoadingIndicatorService } from "../../../shared/services/global-loading-indicator.service";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { AtsStoreModule } from "../../../store/ats-store.module";
import { AccountService } from "../../../shared/services/account.service";
import { MarketService } from "../../../shared/services/market.service";
import { WatchlistCollectionService } from "../../instruments/services/watchlist-collection.service";
import { commonTestProviders } from "../../../shared/utils/testing/common-test-providers";

describe('DesktopSettingsBrokerService', () => {
  let service: DesktopSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        AtsStoreModule
      ],
      providers: [
        {
          provide: DashboardSettingsBrokerService,
          useValue: {
            saveSettings: jasmine.createSpy('saveSettings').and.returnValue(new Subject()),
            readSettings: jasmine.createSpy('readSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            allDashboards$: new Subject()
          }
        },
        {
          provide: WidgetsSettingsBrokerService,
          useValue: {
            removeSettings: jasmine.createSpy('removeSettings').and.returnValue(new Subject()),
            readSettings: jasmine.createSpy('readSettings').and.returnValue(new Subject()),
            saveSettings: jasmine.createSpy('saveSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getAllSettings: jasmine.createSpy('getAllSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: TerminalSettingsBrokerService,
          useValue: {
            readSettings: jasmine.createSpy('readSettings').and.returnValue(new Subject()),
            saveSettings: jasmine.createSpy('saveSettings').and.returnValue(new Subject()),
            removeSettings: jasmine.createSpy('removeSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: GlobalLoadingIndicatorService,
          useValue: {
            isLoading$: new Subject(),
            registerLoading: jasmine.createSpy('registerLoading').and.callThrough(),
            releaseLoading: jasmine.createSpy('releaseLoading').and.callThrough(),
          }
        },
        {
          provide: AccountService,
          useValue: {
            getLoginPortfolios: jasmine.createSpy('getLoginPortfolios').and.returnValue(EMPTY)
          }
        },
        {
          provide: MarketService,
          useValue: {
            getAllExchanges: jasmine.createSpy('getAllExchanges').and.returnValue(EMPTY),
            getDefaultExchange: jasmine.createSpy('getDefaultExchange').and.returnValue(EMPTY),
          }
        },
        {
          provide: WatchlistCollectionService,
          useValue: {
            addItemsToHistory: jasmine.createSpy('addItemsToHistory').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(DesktopSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
