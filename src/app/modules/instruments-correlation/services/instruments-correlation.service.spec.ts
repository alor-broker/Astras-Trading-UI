import { TestBed } from '@angular/core/testing';

import { InstrumentsCorrelationService } from './instruments-correlation.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('InstrumentsCorrelationService', () => {
  let service: InstrumentsCorrelationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(InstrumentsCorrelationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
