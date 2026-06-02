import {
  inject,
  Injectable
} from '@angular/core';
import {Observable} from 'rxjs';
import {
  OrderbookData,
  OrderbookRequest
} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {SubscriptionsDataFeedService} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';

@Injectable({providedIn: 'root'})
export class OrderbookService {
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

  getOrderbookSubscription(
    symbol: string,
    exchange: string,
    instrumentGroup?: string | null,
    depth?: number
  ): Observable<OrderbookData> {
    return this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
      {
        opcode: 'OrderBookGetAndSubscribe',
        code: symbol,
        exchange: exchange,
        depth: depth ?? 17,
        format: 'slim',
        instrumentGroup: instrumentGroup,
      },
      request => `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${request.depth}_${request.format}`
    );
  }
}
