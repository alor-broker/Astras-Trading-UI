import {TestBed} from '@angular/core/testing';
import {
  firstValueFrom,
  of
} from 'rxjs';
import {OrderbookService} from './orderbook.service';
import {SubscriptionsDataFeedService} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';
import {OrderbookData} from './orderbook-service.types';

describe('OrderbookService', () => {
  let service: OrderbookService;
  let subscribe: ReturnType<typeof vi.fn>;

  const orderbook: OrderbookData = {
    a: [{v: 1, p: 100, y: 0}],
    b: [{v: 2, p: 99, y: 0}]
  };

  beforeEach(() => {
    subscribe = vi.fn().mockReturnValue(of(orderbook));

    TestBed.configureTestingModule({
      providers: [
        OrderbookService,
        {provide: SubscriptionsDataFeedService, useValue: {subscribe}}
      ]
    });

    service = TestBed.inject(OrderbookService);
  });

  it('should build a subscription request with default depth 17 and slim format', async () => {
    const result = await firstValueFrom(service.getOrderbookSubscription('SBER', 'MOEX'));

    expect(result).toEqual(orderbook);

    const [request, getKey] = subscribe.mock.calls[0];
    expect(request).toEqual({
      opcode: 'OrderBookGetAndSubscribe',
      code: 'SBER',
      exchange: 'MOEX',
      depth: 17,
      format: 'slim',
      instrumentGroup: undefined
    });
    expect(getKey(request)).toBe('OrderBookGetAndSubscribe_SBER_MOEX_undefined_17_slim');
  });

  it('should use the provided depth and instrument group', async () => {
    await firstValueFrom(service.getOrderbookSubscription('SBER', 'MOEX', 'TQBR', 10));

    const [request, getKey] = subscribe.mock.calls[0];
    expect(request).toMatchObject({depth: 10, instrumentGroup: 'TQBR'});
    expect(getKey(request)).toBe('OrderBookGetAndSubscribe_SBER_MOEX_TQBR_10_slim');
  });
});
