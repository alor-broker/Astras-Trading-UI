import { TestBed } from '@angular/core/testing';

import { WatchlistCollectionBrokerService } from './watchlist-collection-broker.service';

describe('WatchlistCollectionBrokerService', () => {
  let service: WatchlistCollectionBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WatchlistCollectionBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
