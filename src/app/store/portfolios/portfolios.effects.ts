import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {
  filter,
  map,
  tap
} from 'rxjs/operators';
import { ErrorHandlerService } from '../../shared/services/handle-error/error-handler.service';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { Store } from '@ngrx/store';
import { AccountService } from '../../shared/services/account.service';
import {
  initPortfolios,
  initPortfoliosSuccess,
  selectNewPortfolio
} from './portfolios.actions';
import {
  switchMap,
  withLatestFrom
} from 'rxjs';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { catchHttpError } from '../../shared/utils/observable-helper';
import {
  getAllPortfolios,
  getSelectedPortfolioKey
} from './portfolios.selectors';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';

export interface SavedPortfolioState {
  lastActivePortfolio: PortfolioKey;
}

@Injectable()
export class PortfoliosEffects {
  initPortfolios$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initPortfolios),
      switchMap(() => this.accountService.getLoginPortfolios()),
      catchHttpError<PortfolioExtended[] | null>(null, this.errorHandlerService),
      filter(x => !!x),
      map(portfolios => initPortfoliosSuccess({ portfolios: portfolios ?? [] }))
    )
  );

  selectDefaultPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initPortfoliosSuccess),
      withLatestFrom(this.store.select(getAllPortfolios)),
      map(([, portfolios]) => {
        const lastActivePortfolio = this.getSavedPortfolioState()?.lastActivePortfolio;
        if (lastActivePortfolio) {
          const matchedPortfolio = portfolios.find(p =>
            p.portfolio === lastActivePortfolio.portfolio
            && p.exchange === lastActivePortfolio.exchange
            && p.marketType === lastActivePortfolio.marketType);

          if (matchedPortfolio) {
            return selectNewPortfolio({
              portfolio: {
                portfolio: matchedPortfolio.portfolio,
                exchange: matchedPortfolio.exchange,
                marketType: matchedPortfolio.marketType
              } as PortfolioKey
            });
          }
        }

        const defaultPortfolio = portfolios.find(p => p.exchange === 'MOEX' && p.portfolio.startsWith('D'))
          ?? (portfolios.length > 0 ? portfolios[0] : null);
        return selectNewPortfolio({
          portfolio: !!defaultPortfolio
            ? {
              portfolio: defaultPortfolio.portfolio,
              exchange: defaultPortfolio.exchange,
              marketType: defaultPortfolio.marketType
            } as PortfolioKey
            : null
        });
      })
    )
  );

  saveLastActivePortfolio$ = createEffect(() =>
      this.actions$.pipe(
        ofType(selectNewPortfolio),
        withLatestFrom(this.store.select(getSelectedPortfolioKey)),
        tap(([, portfolioKey]) => {
          this.setLastActivePortfolio(
            !!portfolioKey
              ? {
                portfolio: portfolioKey.portfolio,
                exchange: portfolioKey.exchange,
                marketType: portfolioKey.marketType
              } as PortfolioKey
              : null);
        })
      ),
    {
      dispatch: false
    }
  );

  private readonly portfolioStorageKey = 'portfolio';

  constructor(
    private readonly actions$: Actions,
    private readonly accountService: AccountService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
  ) {
  }

  private getSavedPortfolioState(): SavedPortfolioState | null {
    return this.localStorage.getItem<SavedPortfolioState>(this.portfolioStorageKey) ?? null;
  }

  private setLastActivePortfolio(portfolioKey: PortfolioKey | null) {
    this.localStorage.setItem(
      this.portfolioStorageKey,
      {
        ...this.getSavedPortfolioState(),
        lastActivePortfolio: portfolioKey
      } as SavedPortfolioState
    );
  }
}
