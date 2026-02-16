import { TestBed } from '@angular/core/testing';
import { MoneyOperationsService } from './money-operations.service';
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { EnvironmentService } from "./environment.service";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

describe('MoneyOperationsService', () => {
  let service: MoneyOperationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: jasmine.createSpy('get').and.returnValue(of({})),
            post: jasmine.createSpy('post').and.returnValue(of({}))
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
    service = TestBed.inject(MoneyOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
