import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService } from './error-handler.service';
import { LogErrorHandler } from "./log-error-handler";
import { ERROR_HANDLER } from "./error-handler";

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  const handlerSpy = jasmine.createSpyObj('ApplicationErrorHandler', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: ERROR_HANDLER, useValue: handlerSpy, multi: true },
        LogErrorHandler
      ],
    });
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
