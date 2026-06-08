import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';

export interface QuotesServiceMock {
  getQuotesSubscription: ReturnType<typeof vi.fn>;
  getLastPrice: ReturnType<typeof vi.fn>;
}

export interface QuotesServiceMockResult {
  service: QuotesServiceMock;
  provider: Provider;
}

export class QuotesServiceMockFactory {
  static create(lastPrice = 100): QuotesServiceMockResult {
    const service: QuotesServiceMock = {
      getQuotesSubscription: vi.fn().mockReturnValue(of({last_price: lastPrice})),
      getLastPrice: vi.fn().mockReturnValue(of(lastPrice))
    };

    return {
      service,
      provider: {provide: QuotesService, useValue: service}
    };
  }
}
