import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HistoryService } from './history.service';
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { EnvironmentService } from "./environment.service";

describe('HistoryService', () => {
  let service: HistoryService;

  let errorHandlerServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: errorHandlerServiceSpy
        },
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        }
      ]
    });
    service = TestBed.inject(HistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
