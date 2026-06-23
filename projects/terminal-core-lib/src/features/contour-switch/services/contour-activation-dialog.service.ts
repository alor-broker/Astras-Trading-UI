import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {
  map,
  Observable,
  Subject,
  take,
  tap
} from 'rxjs';
import {ContourSwitchApiService} from './contour-switch-api.service';
import {
  ContourActivationResult,
  ContourState
} from '../types/contour-switch.types';

export enum ContourActivationDialogMessage {
  TradingBlocked = 'tradingBlocked',
  ContourActivated = 'contourActivated',
  ActivationUnavailable = 'activationUnavailable',
  TradingUnavailable = 'tradingUnavailable',
  ActivationFailed = 'activationFailed'
}

@Injectable({
  providedIn: 'root'
})
export class ContourActivationDialogService {
  private readonly contourSwitchApiService = inject(ContourSwitchApiService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly showDialogSubject = new Subject<void>();

  readonly showDialog$ = this.showDialogSubject.asObservable();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.showDialogSubject.complete();
    });
  }

  checkStatus(): Observable<void> {
    return this.contourSwitchApiService.getStatus().pipe(
      take(1),
      tap(response => {
        if (response?.state === ContourState.Inactive) {
          this.showDialogSubject.next();
        }
      }),
      map(() => void 0)
    );
  }

  activateCurrentContour(): Observable<ContourActivationResult> {
    return this.contourSwitchApiService.activateCurrentContour().pipe(
      take(1)
    );
  }
}
