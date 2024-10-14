import { TestBed } from '@angular/core/testing';

import { UserPortfoliosService } from './user-portfolios.service';
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { AtsStoreModule } from "../../store/ats-store.module";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AccountService } from "./account.service";
import { EMPTY } from "rxjs";
import { commonTestProviders } from "../utils/testing/common-test-providers";

describe('UserPortfoliosService', () => {
  let service: UserPortfoliosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        AtsStoreModule
      ],
      providers: [
        ...commonTestProviders,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AccountService,
          useValue: {
            getLoginPortfolios: jasmine.createSpy('getLoginPortfolios').and.returnValue(EMPTY)
          }
        }
      ]
    });
    service = TestBed.inject(UserPortfoliosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
