import {Provider} from '@angular/core';
import {WatchlistCollectionBrokerService} from './services/watchlist-collection-broker.service';
import {WatchlistCollectionService} from './services/watchlist-collection.service';

export function provideWatchlist(): Provider[] {
  return [
    WatchlistCollectionBrokerService,
    WatchlistCollectionService
  ];
}
