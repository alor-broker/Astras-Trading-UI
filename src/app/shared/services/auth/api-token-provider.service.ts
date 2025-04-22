import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  BehaviorSubject,
  interval,
  Observable,
  shareReplay
} from "rxjs";
import {
  distinct,
  filter,
  map
} from "rxjs/operators";
import { mapWith } from "../../utils/observable-helper";

export interface TokenState {
  token: string;
  expirationTime: number;
  refreshCallback: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ApiTokenProviderService implements OnDestroy {
  private readonly state$ = new BehaviorSubject<TokenState | null>(null);
  private token$: Observable<string> | null = null;

  ngOnDestroy(): void {
    this.state$.complete();
  }

  getToken(): Observable<string> {
    this.token$ ??= this.state$.pipe(
        filter(s => s != null),
        mapWith(() => interval(1000), (state,) => state),
        map(state => {
          if (this.isTokenNotExpired(state)) {
            return state.token;
          }

          state.refreshCallback();
          return null;
        }),
        filter(t => t != null),
        distinct(),
        shareReplay(1)
      );

    return this.token$;
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
