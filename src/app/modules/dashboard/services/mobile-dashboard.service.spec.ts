import { TestBed } from '@angular/core/testing';

import { MobileDashboardService } from './mobile-dashboard.service';
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { MobileDashboardFeature } from "../../../store/mobile-dashboard/mobile-dashboard.reducer";
import { MobileDashboardEffects } from "../../../store/mobile-dashboard/mobile-dashboard.effects";
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { EMPTY } from "rxjs";
import { MarketService } from "../../../shared/services/market.service";
import { commonTestProviders } from "../../../shared/utils/testing/common-test-providers";

describe('MobileDashboardService', () => {
  let service: MobileDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(MobileDashboardFeature),
        EffectsModule.forFeature([
          MobileDashboardEffects
        ])
      ],
      providers: [
        ...commonTestProviders,
        {
          provide: ManageDashboardsService,
          useValue: {
            getDefaultDashboardConfig: jasmine.createSpy('getDefaultDashboardConfig').and.returnValue(EMPTY)
          }
        },
        {
          provide: MarketService,
          useValue: {
            getAllExchanges: jasmine.createSpy('getAllExchanges').and.returnValue(EMPTY)
          }
        },
      ]
    });
    service = TestBed.inject(MobileDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
