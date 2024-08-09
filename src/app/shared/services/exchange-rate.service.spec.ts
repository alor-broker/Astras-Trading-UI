import { TestBed } from '@angular/core/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { EnvironmentService } from "./environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        ExchangeRateService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(ExchangeRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
