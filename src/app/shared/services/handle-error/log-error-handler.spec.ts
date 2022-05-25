import { TestBed } from '@angular/core/testing';
import { LogErrorHandler } from "./log-error-handler";

describe('LogErrorHandler: Register', () => {
  let service: LogErrorHandler;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogErrorHandler
      ],
    });
    service = TestBed.inject(LogErrorHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
