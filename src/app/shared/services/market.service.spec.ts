import { TestBed } from '@angular/core/testing';

import { MarketService } from './market.service';
import { HttpClient } from "@angular/common/http";

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: jasmine.createSpy('get').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(MarketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
