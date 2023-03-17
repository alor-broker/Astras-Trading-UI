import { TestBed } from '@angular/core/testing';
import { LogErrorHandler } from "./log-error-handler";
import { LoggerService } from '../logging/logger.service';

describe('LogErrorHandler: Register', () => {
  let service: LogErrorHandler;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogErrorHandler,
        {
          provide: LoggerService,
          useValue: {
            error: jasmine.createSpy('error').and.callThrough()
          }
        }
      ],
    });
    service = TestBed.inject(LogErrorHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
