import { TestBed } from '@angular/core/testing';

import { BondScreenerService } from './bond-screener.service';
import { Apollo } from "apollo-angular";
import { of } from "rxjs";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('BondScreenerService', () => {
  let service: BondScreenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Apollo,
          useValue: {
            watchQuery: jasmine.createSpy('watchQuery').and.returnValue({ valueChanges: of({})})
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {}
        },
      ]
    });
    service = TestBed.inject(BondScreenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
