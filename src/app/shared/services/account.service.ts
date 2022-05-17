import { Injectable } from '@angular/core';
import { distinct, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { findUnique } from 'src/app/shared/utils/collections';
import { Observable } from 'rxjs';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { HttpClient } from '@angular/common/http';
import { FullName } from 'src/app/shared/models/user/full-name.model';
import { environment } from 'src/environments/environment';
import { PortfolioMeta } from 'src/app/shared/models/user/portfolio-meta.model';
import { PortfolioExtended } from '../models/user/portfolio-extended.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private accountUrl = environment.clientDataUrl + '/client/v1.0';
  constructor(
    private auth: AuthService,
    private positionsService: PositionsService,
    private http: HttpClient
  ) {}

  getFullName() {
    return this.auth.currentUser$.pipe(
      switchMap((u) =>
        this.http.get<FullName>(`${this.accountUrl}/users/${u.login}/full-name`)
      )
    );
  }

  getActivePortfolios(): Observable<Map<string, PortfolioExtended[]>> {
    return this.auth.currentUser$.pipe(
      map((u) => u.login),
      distinct(),
      switchMap((login) => this.positionsService.getAllByLogin(login)),
      map((positions) => {
        return findUnique(
          positions,
          (pos): PortfolioKey => ({
            portfolio: pos.portfolio,
            exchange: pos.exchange,
          })
        );
      }),
      switchMap(portfolioKeys => {
        return this.getAllPortfolios().pipe(
          map(portfolioMeta => this.mergePortfolios(portfolioMeta, portfolioKeys))
        );
      })
    );
  }

  private getAllPortfolios() : Observable<PortfolioMeta[]> {
    return this.auth.currentUser$.pipe(
      switchMap((u) =>
        this.http.get<PortfolioMeta[]>(
          `${this.accountUrl}/users/${u.clientId}/all-portfolios`
        )
      )
    );
  }

  private mergePortfolios(portfolioMeta: PortfolioMeta[], portfolioKeys: PortfolioKey[]) {
    let extendedPortfoliosByAgreement = new Map<string,  PortfolioExtended[]>();
    const formatMarket = (market: string, exchange: string) => {
      market = market.split(' ')[0];
      if (market.startsWith('Фондовый')) {
        return `${market.slice(0, 4)} ${exchange}`;
      }
      return `${market}`;
    };
    for (const portfolio of portfolioKeys) {
      const meta = portfolioMeta.find(p => p.portfolio == portfolio.portfolio);
      if (meta) {
        const existing = extendedPortfoliosByAgreement.get(meta.agreement);
        if (!existing) {
          extendedPortfoliosByAgreement.set(meta.agreement, [{
            ...meta,
            ...portfolio,
            market: formatMarket(meta.market, portfolio.exchange)
          }]);
        }
        else {
          existing.push({
            ...meta,
            ...portfolio,
            market: formatMarket(meta.market, portfolio.exchange)
          });
        }
      }
    }
    return extendedPortfoliosByAgreement;
  }
}
