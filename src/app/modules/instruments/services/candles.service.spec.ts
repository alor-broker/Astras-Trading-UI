import { TestBed } from '@angular/core/testing';

import { CandlesService } from './candles.service';
import { of } from "rxjs";

describe('CandlesService', () => {
  let service: CandlesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CandlesService,
          useValue: {
            getInstrumentLastCandle: jasmine.createSpy('getInstrumentLastCandle').and.returnValue(of({}))
          }
        }
      ]
    });
    service = TestBed.inject(CandlesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
