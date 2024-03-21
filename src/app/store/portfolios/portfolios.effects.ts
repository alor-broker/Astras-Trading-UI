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
  take,
  tap
} from 'rxjs';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { catchHttpError } from '../../shared/utils/observable-helper';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';
import { PortfoliosInternalActions } from "./portfolios.actions";
import { GlobalLoadingIndicatorService } from "../../shared/services/global-loading-indicator.service";
import { GuidGenerator } from "../../shared/utils/guid";

export interface SavedPortfolioState {
  lastActivePortfolio: PortfolioKey;
}

@Injectable()
export class PortfoliosEffects {
  private readonly loadingId = GuidGenerator.newGuid();

  initPortfolios$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosInternalActions.init),
      tap(() => this.globalLoadingIndicatorService.registerLoading(this.loadingId)),
      switchMap(() => this.accountService.getLoginPortfolios()),
      take(1),
      catchHttpError<PortfolioExtended[] | null>(null, this.errorHandlerService),
      tap(() => this.globalLoadingIndicatorService.releaseLoading(this.loadingId)),
      filter(x => !!x),
      map(portfolios => PortfoliosInternalActions.initSuccess({ portfolios: portfolios ?? [] }))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly accountService: AccountService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly globalLoadingIndicatorService: GlobalLoadingIndicatorService
  ) {
  }
}
