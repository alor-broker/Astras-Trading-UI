import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EvaluationService } from './evaluation.service';
import { commonTestProviders } from '../utils/testing';
import { EnvironmentService } from "./environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('EvaluationService', () => {
  let service: EvaluationService;

  beforeAll(() => TestBed.resetTestingModule());
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
        EvaluationService,
        ...commonTestProviders,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    service = TestBed.inject(EvaluationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
