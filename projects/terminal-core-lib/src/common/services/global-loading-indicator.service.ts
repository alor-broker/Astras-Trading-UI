import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  BehaviorSubject,
  map,
  take
} from 'rxjs';

@Injectable({providedIn: 'root'})
export class GlobalLoadingIndicatorService implements OnDestroy {
  private readonly loadingState$ = new BehaviorSubject<Set<string>>(new Set<string>());

  isLoading$ = this.loadingState$.pipe(
    map(s => s.size > 0)
  );

  ngOnDestroy(): void {
    this.loadingState$.complete();
  }

  registerLoading(loadingId: string): void {
    this.loadingState$.pipe(
      take(1)
    ).subscribe(s => {
      s.add(loadingId);
      this.updateState(s);
    });
  }

  releaseLoading(loadingId: string): void {
    this.loadingState$.pipe(
      take(1)
    ).subscribe(s => {
      s.delete(loadingId);
      this.updateState(s);
    });
  }

  private updateState(state: Set<string>): void {
    // use setTimeout to prevent ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => this.loadingState$.next(state), 0);
  }
}
