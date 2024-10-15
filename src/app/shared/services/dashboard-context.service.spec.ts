import { TestBed } from '@angular/core/testing';

import { DashboardContextService } from './dashboard-context.service';
import { provideHttpClient, } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { commonTestProviders } from "../utils/testing/common-test-providers";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { DashboardsFeature } from "../../store/dashboards/dashboards.reducer";

describe('DashboardContextService', () => {
  let service: DashboardContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(DashboardsFeature),
      ],
      providers: [
        ...commonTestProviders,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DashboardContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
