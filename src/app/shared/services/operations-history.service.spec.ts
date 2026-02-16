import { TestBed } from '@angular/core/testing';
import { OperationsHistoryService } from './operations-history.service';
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { EnvironmentService } from "./environment.service";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

describe('OperationsHistoryService', () => {
  let service: OperationsHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: jasmine.createSpy('get').and.returnValue(of({}))
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            clientDataUrl: 'http://localhost'
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {}
        }
      ]
    });
    service = TestBed.inject(OperationsHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
