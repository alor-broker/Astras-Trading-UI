import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';

export interface MarketServiceMock {
  getMarketSettings: ReturnType<typeof vi.fn>;
}

export interface MarketServiceMockResult {
  service: MarketServiceMock;
  provider: Provider;
}

export class MarketServiceMockFactory {
  static create(exchange = 'MOEX'): MarketServiceMockResult {
    const service: MarketServiceMock = {
      getMarketSettings: vi.fn().mockReturnValue(of({
        exchanges: [
          {
            exchange,
            settings: {timezone: 'Europe/Moscow'}
          }
        ]
      }))
    };

    return {
      service,
      provider: {provide: MarketService, useValue: service}
    };
  }
}
