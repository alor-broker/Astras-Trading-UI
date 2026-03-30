import { Injectable, inject } from '@angular/core';
import {
  map,
  switchMap
} from 'rxjs/operators';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { findUnique } from 'src/app/shared/utils/collections';
import {
  Observable,
  take
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FullName } from 'src/app/shared/models/user/full-name.model';
import { PortfolioMeta } from 'src/app/shared/models/user/portfolio-meta.model';
import { PortfolioExtended } from '../models/user/portfolio-extended.model';
import {
  formatMarket,
  getMarketTypeByPortfolio
} from "../utils/portfolios";
import {
  catchHttpError,
  mapWith
} from '../utils/observable-helper';
import { EnvironmentService } from "./environment.service";
import { Exchange } from "../../../generated/graphql.types";
import {
  USER_CONTEXT,
  UserContext
} from "./auth/user-context";
import { PortfolioDynamics } from "../models/user/portfolio-dynamics.model";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

@Injectable({
  providedIn: 'any',
})
export class AccountService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly userContext = inject<UserContext>(USER_CONTEXT);
  private readonly positionsService = inject(PositionsService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly accountUrl = this.environmentService.clientDataUrl + '/client/v1.0';
  private readonly accountUrl2 = this.environmentService.clientDataUrl + '/client/v2.0';

  getFullName(): Observable<FullName> {
    return this.userContext.getUser().pipe(
      switchMap((u) =>
        this.httpClient.get<FullName>(`${this.accountUrl}/users/${u.login}/full-name`)
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
        source => this.getAllPortfolios(source.userInfo.clientId ?? ''),
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

  getPortfolioDynamicsForAgreement(
    agreement: string,
    fromDate: Date,
    toDate: Date
  ): Observable<PortfolioDynamics | null> {
    return this.httpClient.get<PortfolioDynamics>(
      `${this.accountUrl2}/agreements/${agreement}/portfolios/any/dynamics`,
      {
        params: {
          startDate: fromDate.toISOString(),
          endDate: toDate.toISOString()
        }
      }
    ).pipe(
      catchHttpError<PortfolioDynamics | null>(null, this.errorHandlerService),
      map(r => {
        if(r == null) {
          return r;
        }

        return {
          ...r,
          portfolioValues: r.portfolioValues.map(i => ({
            ...i,
            date: new Date(i.date)
          }))
        };
      }),
      take(1)
    );
  }

  private getAllPortfolios(clientId: string): Observable<PortfolioMeta[]> {
    return this.httpClient.get<PortfolioMeta[]>(
      `${this.accountUrl}/users/${clientId}/all-portfolios`
    );
  }
}
