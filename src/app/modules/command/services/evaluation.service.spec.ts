import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { EvaluationService } from './evaluation.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';

describe('EvaluationService', () => {
  let service: EvaluationService;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        EvaluationService,
        provideMockStore(),
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    });

    service = TestBed.inject(EvaluationService);
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
