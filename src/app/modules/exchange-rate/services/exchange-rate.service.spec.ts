import { TestBed } from '@angular/core/testing';

import { ExchangeRateService } from './exchange-rate.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { sharedModuleImportForTests } from "../../../shared/utils/testing";

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        ExchangeRateService,
      ]
    });
    service = TestBed.inject(ExchangeRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
