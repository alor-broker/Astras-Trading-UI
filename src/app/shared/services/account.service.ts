import {
  Inject,
  Injectable
} from '@angular/core';
import {
  map,
  switchMap
} from 'rxjs/operators';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { findUnique } from 'src/app/shared/utils/collections';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FullName } from 'src/app/shared/models/user/full-name.model';
import { PortfolioMeta } from 'src/app/shared/models/user/portfolio-meta.model';
import { PortfolioExtended } from '../models/user/portfolio-extended.model';
import {
  formatMarket,
  getMarketTypeByPortfolio
} from "../utils/portfolios";
import { mapWith } from '../utils/observable-helper';
import { EnvironmentService } from "./environment.service";
import { Exchange } from "../../../generated/graphql.types";
import {
  USER_CONTEXT,
  UserContext
} from "./auth/user-context";

@Injectable({
  providedIn: 'any',
})
export class AccountService {
  private readonly accountUrl = this.environmentService.clientDataUrl + '/client/v1.0';

  constructor(
    private readonly environmentService: EnvironmentService,
    @Inject(USER_CONTEXT)
    private readonly userContext: UserContext,
    private readonly positionsService: PositionsService,
    private readonly http: HttpClient
  ) {
  }

  getFullName(): Observable<FullName> {
    return this.userContext.getUser().pipe(
      switchMap((u) =>
        this.http.get<FullName>(`${this.accountUrl}/users/${u.login}/full-name`)
      )
    );
  }

  getLoginPortfolios(): Observable<PortfolioExtended[]> {
    return this.userContext.getUser().pipe(
      mapWith(
        userInfo => this.positionsService.getAllByLogin(userInfo.login!),
        (userInfo, positions) => ({ userInfo, positions })
      ),
      mapWith(
        source => this.getAllPortfolios(source.userInfo.clientId),
        (source, allPortfolios) => ({
          positions: source.positions,
          allPortfolios
        })
      ),
      map(source => {
        const positionPortfolios = findUnique(
          source.positions,
          pos => ({
            portfolio: pos.portfolio,
            exchange: pos.exchange,
          })
        );

        return positionPortfolios.reduce((prev, curr) => {
          const portfolio = source.allPortfolios.find(p => p.portfolio === curr.portfolio);
          if (portfolio != null) {
            const exchange = portfolio.isVirtual
              ? Exchange.United
              : curr.exchange;

            return [
              ...prev,
              {
                ...portfolio,
                exchange: exchange,
                market: formatMarket(portfolio.market, exchange),
                marketType: getMarketTypeByPortfolio(portfolio.portfolio)
              } as PortfolioExtended
            ];
          }

          return prev;
        }, [] as PortfolioExtended[]);
      })
    );
  }

  private getAllPortfolios(clientId: string): Observable<PortfolioMeta[]> {
    return this.http.get<PortfolioMeta[]>(
      `${this.accountUrl}/users/${clientId}/all-portfolios`
    );
  }
}
