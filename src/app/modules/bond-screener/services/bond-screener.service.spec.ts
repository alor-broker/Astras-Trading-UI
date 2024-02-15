import { TestBed } from '@angular/core/testing';

import { BondScreenerService } from './bond-screener.service';

describe('BondScreenerService', () => {
  let service: BondScreenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BondScreenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
