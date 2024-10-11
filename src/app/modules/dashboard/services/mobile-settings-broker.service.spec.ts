import { TestBed } from '@angular/core/testing';

import { MobileSettingsBrokerService } from './mobile-settings-broker.service';
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";
import {
  EMPTY,
  Subject
} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { GlobalLoadingIndicatorService } from "../../../shared/services/global-loading-indicator.service";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { AtsStoreModule } from "../../../store/ats-store.module";
import { AccountService } from "../../../shared/services/account.service";
import { MarketService } from "../../../shared/services/market.service";
import { WatchlistCollectionService } from "../../instruments/services/watchlist-collection.service";
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { commonTestProviders } from "../../../shared/utils/testing/common-test-providers";

describe('MobileSettingsBrokerService', () => {
  let service: MobileSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        AtsStoreModule
      ],
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            setItem: jasmine.createSpy('setItem').and.callThrough(),
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            removeItem: jasmine.createSpy('removeItem').and.callThrough(),
            onOuterChange: jasmine.createSpy('onOuterChange').and.returnValue(new Subject()),
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            clientDataUrl : ''
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
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
        {
          provide: ManageDashboardsService,
          useValue: {
            getDefaultDashboardConfig: jasmine.createSpy('getDefaultDashboardConfig').and.returnValue(EMPTY)
          }
        },
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(MobileSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
