import { TestBed } from '@angular/core/testing';

import { InstrumentSearchService } from './instrument-search.service';

describe('InstrumentSearchService', () => {
  let service: InstrumentSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InstrumentSearchService]
    });
    service = TestBed.inject(InstrumentSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
