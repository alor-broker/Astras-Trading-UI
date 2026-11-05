import {firstValueFrom, of} from 'rxjs';
import {UserPortfoliosHelper} from './user-portfolios.helper';
import {AccountService} from '../../client-info/services/account-service';
import {AllPositionsService} from '../../client-info/services/all-positions.service';
import {MarketService} from '../../market-config/market.service';
import {MarketExchange} from '../../market-config/market-config.types';
import {MarketType, PortfolioExtended, PortfolioMeta} from '../../../common/types/portfolio.types';
import {PositionWarpResponse} from '../types/position.types';
import {PortfolioFixtures} from '@testing-lib/fixtures/portfolio';
import {PositionFixtures} from '@testing-lib/fixtures/position';

describe('UserPortfoliosHelper', () => {
  let exchanges: MarketExchange[];

  beforeEach(() => {
    const settings = {
      defaultPortfolioCurrencyInstrument: 'RUB',
      timezone: 'Europe/Moscow',
      defaultTradingSession: '0700-0000'
    };
    exchanges = [
      {exchange: 'MOEX', settings},
      {exchange: 'SPBX', settings: {...settings, isDefault: true}}
    ];
  });

  function loadPortfolios(
    portfolios: PortfolioMeta[] | null,
    positions: PositionWarpResponse[] | null
  ): Promise<PortfolioExtended[] | null> {
    return firstValueFrom(UserPortfoliosHelper.loadActiveUserPortfolios(
      {getAllPortfolios: vi.fn(() => of(portfolios))} as unknown as AccountService,
      {getAllUserPositions: vi.fn(() => of(positions))} as unknown as AllPositionsService,
      {getAllExchanges: vi.fn(() => of(exchanges))} as unknown as MarketService
    ));
  }

  it('should keep only portfolios with positions when any are available', async () => {
    const empty = PortfolioFixtures.createPortfolioExtended({portfolio: 'D1'});
    const active = PortfolioFixtures.createPortfolioExtended({portfolio: 'D2', market: 'Фондовый рынок'});
    const position = {
      ...PositionFixtures.createPosition({qtyTFuture: 10}),
      portfolio: active.portfolio,
      exchange: 'MOEX',
      symbol: 'SBER'
    };

    const result = await loadPortfolios([empty, active], [position]);

    expect(result).toEqual([{...active, market: 'Фонд MOEX'}]);
  });

  it('should keep only the first empty portfolio using the configured default exchange', async () => {
    const first = PortfolioFixtures.createPortfolioExtended({portfolio: 'D1', market: 'Фондовый рынок'});
    const second = PortfolioFixtures.createPortfolioExtended({portfolio: 'D2'});

    const result = await loadPortfolios([first, second], []);

    expect(result).toEqual([{...first, exchange: 'SPBX', market: 'Фонд SPBX'}]);
  });

  it('should use UNITED for an empty virtual portfolio', async () => {
    const portfolio = PortfolioFixtures.createPortfolioExtended({portfolio: 'E1', isVirtual: true});

    const result = await loadPortfolios([portfolio], []);

    expect(result).toEqual([{...portfolio, exchange: 'UNITED', marketType: MarketType.United}]);
  });

  it('should use the first configured exchange when none is marked as default', async () => {
    const portfolio = PortfolioFixtures.createPortfolioExtended();
    exchanges = exchanges.map(exchange => ({...exchange, settings: {...exchange.settings, isDefault: false}}));

    const result = await loadPortfolios([portfolio], []);

    expect(result).toEqual([portfolio]);
  });

  it('should keep an empty list when the client has no portfolios', async () => {
    const result = await loadPortfolios([], []);

    expect(result).toEqual([]);
  });

  it('should preserve a failed portfolio request as null', async () => {
    const result = await loadPortfolios(null, []);

    expect(result).toBeNull();
  });

  it('should not treat a failed positions request as an empty portfolio', async () => {
    const result = await loadPortfolios([PortfolioFixtures.createPortfolioExtended()], null);

    expect(result).toBeNull();
  });
});
