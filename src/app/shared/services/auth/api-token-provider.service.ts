import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  BehaviorSubject,
  interval,
  Observable,
  Subject
} from "rxjs";
import {
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap
} from "rxjs/operators";

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
  private readonly destroy$ = new Subject<void>();
  private refreshInProgress = false;

  constructor() {
    // Background auto-refresh: periodically check token expiration while app is active
    this.state$.pipe(
      filter(s => s != null),
      switchMap(state => interval(1000).pipe(map(() => state))),
      takeUntil(this.destroy$)
    ).subscribe(state => {
      if (!this.isTokenNotExpired(state!) && !this.refreshInProgress) {
        this.triggerRefresh(state!);
      }
    });
  }

  ngOnDestroy(): void {
    this.state$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  getToken(): Observable<string> {
    return this.state$.pipe(
      filter(s => s != null),
      tap(state => {
        // Check expiration on every call and trigger refresh if needed
        if (!this.isTokenNotExpired(state!) && !this.refreshInProgress) {
          this.triggerRefresh(state!);
        }
      }),
      // Wait for a valid (non-expired) token
      filter(state => this.isTokenNotExpired(state!)),
      map(state => state!.token),
      take(1)
    );
  }

  updateTokenState(state: TokenState): void {
    this.refreshInProgress = false;
    this.state$.next(state);
  }

  clearToken(): void {
    this.refreshInProgress = false;
    this.state$.next(null);
  }

  private triggerRefresh(state: TokenState): void {
    this.refreshInProgress = true;
    state.refreshCallback();
  }

  private isTokenNotExpired(state: TokenState): boolean {
    const timeReserveMs = 1000 * 5;
    const now = Date.now() + timeReserveMs;
    return now < state.expirationTime;
  }
}
