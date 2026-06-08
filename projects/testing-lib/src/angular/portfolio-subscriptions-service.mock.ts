import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';

export interface PortfolioSubscriptionsServiceMock {
  getInstrumentPositionSubscription: ReturnType<typeof vi.fn>;
}

export interface PortfolioSubscriptionsServiceMockResult {
  service: PortfolioSubscriptionsServiceMock;
  provider: Provider;
}

export class PortfolioSubscriptionsServiceMockFactory {
  static create(): PortfolioSubscriptionsServiceMockResult {
    const service: PortfolioSubscriptionsServiceMock = {
      getInstrumentPositionSubscription: vi.fn().mockReturnValue(of(null))
    };

    return {
      service,
      provider: {provide: PortfolioSubscriptionsService, useValue: service}
    };
  }
}
