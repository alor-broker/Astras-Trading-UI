import { TestBed } from '@angular/core/testing';

import { WatchInstrumentsService } from './watch-instruments.service';

describe('WatchInstrumentsService', () => {
  let service: WatchInstrumentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WatchInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
