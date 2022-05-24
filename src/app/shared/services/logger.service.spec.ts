import { LoggerService } from "./logger.service";
import { TestBed } from '@angular/core/testing';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    service = new LoggerService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
