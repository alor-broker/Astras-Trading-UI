import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EvaluationService } from './evaluation.service';
import { sharedModuleImportForTests } from '../utils/testing';
import { ErrorHandlerService } from './handle-error/error-handler.service';

describe('EvaluationService', () => {
  let service: EvaluationService;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        EvaluationService
      ]
    });

    service = TestBed.inject(EvaluationService);
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
