import { TestBed } from '@angular/core/testing';

import { ManageDashboardsService } from './manage-dashboards.service';
import { Subject } from "rxjs";
import { DashboardContextService } from './dashboard-context.service';
import { EnvironmentService } from "./environment.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { commonTestProviders } from "../utils/testing/common-test-providers";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { DashboardsFeature } from "../../store/dashboards/dashboards.reducer";
import { DashboardsEffects } from "../../store/dashboards/dashboards.effects";

describe('ManageDashboardsService', () => {
  let service: ManageDashboardsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(DashboardsFeature),
        EffectsModule.forFeature([DashboardsEffects])
      ],
      providers:
        [
          ManageDashboardsService,
          {
            provide: EnvironmentService,
            useValue: {
              clientDataUrl: ''
            }
          },
          {
            provide: DashboardContextService,
            useValue: {
              selectedDashboard$: new Subject()
            }
          },
          ...commonTestProviders,
          provideHttpClient(),
          provideHttpClientTesting()
        ]
    });

    service = TestBed.inject(ManageDashboardsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
