import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {
  filter,
  map
} from 'rxjs/operators';
import { ErrorHandlerService } from '../../shared/services/handle-error/error-handler.service';
import { AccountService } from '../../shared/services/account.service';
import {
  switchMap,
  take
} from 'rxjs';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { catchHttpError } from '../../shared/utils/observable-helper';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';
import {
  InternalPortfoliosActions,
  PortfoliosActions
} from './portfolios.actions';

export interface SavedPortfolioState {
  lastActivePortfolio: PortfolioKey;
}

@Injectable()
export class PortfoliosEffects {
  initPortfolios$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosActions.initPortfolios),
      switchMap(() => this.accountService.getLoginPortfolios()),
      take(1),
      catchHttpError<PortfolioExtended[] | null>(null, this.errorHandlerService),
      filter(x => !!x),
      map(portfolios => InternalPortfoliosActions.initPortfoliosSuccess({ portfolios: portfolios ?? [] }))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly accountService: AccountService,
    private readonly errorHandlerService: ErrorHandlerService,
  ) {
  }
}
