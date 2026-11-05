import {TestBed} from '@angular/core/testing';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom, of, toArray} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {MarketSettings} from '@terminal-core-lib/features/market-config/market-config.types';
import {MarketServiceMockFactory, MarketServiceMockResult} from '@testing-lib/angular/market-service.mock';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';
import {PositionFixtures} from '@testing-lib/fixtures/position';
import {OrdersNotificationsService} from './order-notifications.service';
import {BlotterService} from './blotter.service';
import {BlotterWidgetSettings} from '../widget-settings.types';

describe('BlotterService', () => {
  const settings: BlotterWidgetSettings = {
    ...PortfolioFixtures.createPortfolioKey(),
    guid: 'blotter',
    activeTabIndex: 0,
    isSoldPositionsHidden: true
  };
  const baseCurrency = 'AMD';

  let service: BlotterService;
  let marketService: MarketServiceMockResult;
  let getAllPositionsSubscription: ReturnType<typeof vi.fn<PortfolioSubscriptionsService['getAllPositionsSubscription']>>;

  beforeEach(() => {
    getAllPositionsSubscription = vi.fn().mockReturnValue(of([]));
    marketService = MarketServiceMockFactory.create();
    marketService.service.getMarketSettings.mockReturnValue(of({
      exchanges: [],
      currencies: {
        baseCurrency,
        defaultCurrencyExchange: settings.exchange,
        portfolioCurrencies: []
      }
    } satisfies MarketSettings));

    TestBed.configureTestingModule({
      providers: [
        BlotterService,
        marketService.provider,
        {provide: PortfolioSubscriptionsService, useValue: {getAllPositionsSubscription}},
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl: 'https://api.test'}},
        {provide: OrdersNotificationsService, useValue: {}},
        {provide: HttpClient, useValue: {}},
        {provide: ErrorHandlerService, useValue: {}},
        {provide: ACTIONS_CONTEXT, useValue: {selectInstrument: vi.fn()}}
      ]
    });

    service = TestBed.inject(BlotterService);
  });

  describe('getPositions', () => {
    it('should display the configured base currency with zero balances for an empty portfolio', async () => {
      const result = await firstValueFrom(service.getPositions(settings, true));

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ownedPortfolio: {portfolio: settings.portfolio, exchange: settings.exchange},
        targetInstrument: {symbol: baseCurrency, exchange: settings.exchange},
        shortName: baseCurrency,
        isCurrency: true,
        qtyT0: 0,
        qtyT1: 0,
        qtyT2: 0,
        qtyTFuture: 0,
        qtyTFutureBatch: 0,
        volume: 0,
        currentVolume: 0,
        unrealisedPl: 0
      });
      expect(getAllPositionsSubscription).toHaveBeenCalledWith(settings.portfolio, settings.exchange);
    });

    it('should keep the empty list for consumers that do not request a currency placeholder', async () => {
      const result = await firstValueFrom(service.getPositions(settings));

      expect(result).toEqual([]);
      expect(marketService.service.getMarketSettings).not.toHaveBeenCalled();
    });

    it('should replace the placeholder when real positions arrive', async () => {
      const position = PositionFixtures.createPosition({qtyTFuture: 10, qtyTFutureBatch: 10});
      getAllPositionsSubscription.mockReturnValue(of([], [position]));

      const results = await firstValueFrom(service.getPositions(settings, true).pipe(toArray()));

      expect(results[0][0].targetInstrument.symbol).toBe(baseCurrency);
      expect(results[1]).toEqual([position]);
    });

    it('should not replace positions hidden by the sold-position filter with a zero balance', async () => {
      getAllPositionsSubscription.mockReturnValue(of([PositionFixtures.createPosition({qtyTFuture: 0})]));

      const result = await firstValueFrom(service.getPositions(settings, true));

      expect(result).toEqual([]);
      expect(marketService.service.getMarketSettings).not.toHaveBeenCalled();
    });

    it('should preserve sold positions when their display is enabled', async () => {
      const position = PositionFixtures.createPosition({qtyTFuture: 0});
      getAllPositionsSubscription.mockReturnValue(of([position]));

      const result = await firstValueFrom(service.getPositions({...settings, isSoldPositionsHidden: false}, true));

      expect(result).toEqual([position]);
    });
  });

  it('should not select a trading instrument for the base-currency row', async () => {
    const instrument = await firstValueFrom(service.getInstrumentToSelect(baseCurrency, settings.exchange, null));

    expect(instrument).toBeNull();
  });
});
