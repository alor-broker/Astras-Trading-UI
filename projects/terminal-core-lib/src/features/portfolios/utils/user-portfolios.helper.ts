import {
  combineLatest,
  map,
  Observable,
  take
} from 'rxjs';
import {PortfolioExtended} from '../../../common/types/portfolio.types';
import {AccountService} from '../../client-info/services/account-service';
import {AllPositionsService} from '../../client-info/services/all-positions.service';
import {ArrayHelper} from '../../../common/utils/array.helper';
import {Exchange} from '../../instruments/graphql/schema/graphql.types';
import {PortfolioKeyHelper} from '../../../common/utils/portfolio-key.helper';
import {MarketService} from '../../market-config/market.service';

export class UserPortfoliosHelper {
  static loadActiveUserPortfolios(
    accountService: AccountService,
    allPositionsService: AllPositionsService,
    marketService: MarketService
  ): Observable<PortfolioExtended[] | null> {
    return combineLatest({
      allPortfolios: accountService.getAllPortfolios(),
      allPositions: allPositionsService.getAllUserPositions(),
      exchanges: marketService.getAllExchanges()
    }).pipe(
      take(1),
      map(result => {
        if (result.allPortfolios != null && result.allPositions != null) {
          const portfolioWithPositions = ArrayHelper.findUnique(
            result.allPositions,
            element => ({
              portfolio: element.portfolio,
              exchange: element.exchange
            })
          );

          const activePortfolios = portfolioWithPositions.reduce((prev, curr) => {
            const portfolio = result.allPortfolios!.find(p => p.portfolio === curr.portfolio);

            if (portfolio != null) {
              const exchange = portfolio.isVirtual
                ? Exchange.United as string
                : curr.exchange;

              prev.push({
                  ...portfolio,
                  exchange: exchange,
                  market: this.formatPortfolioMarket(portfolio.market, exchange),
                  marketType: PortfolioKeyHelper.getMarketTypeByPortfolio(portfolio.portfolio)
                } satisfies PortfolioExtended
              );
            }

            return prev;
          }, [] as PortfolioExtended[]);

          if (activePortfolios.length > 0 || result.allPortfolios.length === 0) {
            return activePortfolios;
          }

          const portfolio = result.allPortfolios[0];
          const exchange = portfolio.isVirtual
            ? Exchange.United
            : result.exchanges.find(e => e.settings.isDefault ?? false)?.exchange ?? result.exchanges[0]?.exchange;

          return exchange != null
            ? [{
              ...portfolio,
              exchange,
              market: this.formatPortfolioMarket(portfolio.market, exchange),
              marketType: PortfolioKeyHelper.getMarketTypeByPortfolio(portfolio.portfolio)
            }]
            : [];
        }

        return null;
      })
    );
  }

  private static formatPortfolioMarket(market: string, exchange: string): string {
    // TODO: Localization
    market = market.split(' ')[0];
    if (market.startsWith('Фондовый')) {
      return `Фонд ${exchange}`;
    }
    return `${market}`;
  }
}
