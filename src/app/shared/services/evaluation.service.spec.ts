import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EvaluationService } from './evaluation.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../utils/testing';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { DashboardContextService } from './dashboard-context.service';
import { Subject } from 'rxjs';
import { EnvironmentService } from "./environment.service";

describe('EvaluationService', () => {
  let service: EvaluationService;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
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
        EvaluationService,
        ...commonTestProviders
      ]
    });

    service = TestBed.inject(EvaluationService);
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
