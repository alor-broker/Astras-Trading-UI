import { TestBed } from '@angular/core/testing';

import { TradesHistoryService } from './trades-history.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

describe('TradesHistoryService', () => {
  let service: TradesHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(TradesHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
