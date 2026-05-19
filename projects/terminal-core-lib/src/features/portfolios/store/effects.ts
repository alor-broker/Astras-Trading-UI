import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {map} from 'rxjs';
import {PortfoliosInternalActions} from './actions';

@Injectable()
export class PortfoliosEffects {
  private readonly actions$ = inject(Actions);

  initPortfoliosWithList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfoliosInternalActions.initWithList),
      map(action => PortfoliosInternalActions.initSuccess({portfolios: action.portfolios}))
    )
  );
}
