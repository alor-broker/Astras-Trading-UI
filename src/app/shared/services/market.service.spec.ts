import { TestBed } from '@angular/core/testing';

import { MarketService } from './market.service';
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: jasmine.createSpy('get').and.returnValue(of({}))
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
