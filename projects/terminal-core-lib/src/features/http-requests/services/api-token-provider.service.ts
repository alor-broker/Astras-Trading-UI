import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  BehaviorSubject,
  interval,
  Observable,
  of,
  shareReplay
} from "rxjs";
import {
  distinct,
  exhaustMap,
  filter,
  map,
  switchMap,
  take
} from "rxjs/operators";
import {TokenState} from "./api-token-provider.types";
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';


@Injectable()
export class ApiTokenProviderService implements OnDestroy {
  private readonly state$ = new BehaviorSubject<TokenState | null>(null);

  private tokenRefresh$: Observable<TokenState> | null = null;

  ngOnDestroy(): void {
    this.state$.complete();
  }

  getToken(): Observable<string> {
    this.tokenRefresh$ ??= this.state$.pipe(
      filter((s): s is TokenState => s != null),
      mapWith(() => interval(1000), (state,) => state),
      exhaustMap(state => {
        if (this.isTokenNotExpired(state)) {
          return of(state);
        }

        return state.refreshCallback().pipe(
          switchMap(refreshResult => {
            if (!refreshResult) {
              return of(null);
            }

            return this.state$.pipe(
              filter((s): s is TokenState => s != null),
              take(1)
            );
          })
        );
      }),
      filter((t): t is TokenState => t != null),
      distinct(),
      shareReplay(1)
    );

    return this.tokenRefresh$.pipe(
      // need to check expiration for each subscriber because cached token can be expired
      filter(state => this.isTokenNotExpired(state)),
      map(state => state.token)
    );
  }

  updateTokenState(state: TokenState): void {
    this.state$.next(state);
  }

  clearToken(): void {
    this.state$.next(null);
  }

  private isTokenNotExpired(state: TokenState): boolean {
    const timeReserveMs = 1000 * 5;
    const now = Date.now() + timeReserveMs;
    return now < state.expirationTime;
  }
}
