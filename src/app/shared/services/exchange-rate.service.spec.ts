import { TestBed } from '@angular/core/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { EnvironmentService } from "./environment.service";

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        ExchangeRateService
      ]
    });
    service = TestBed.inject(ExchangeRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
