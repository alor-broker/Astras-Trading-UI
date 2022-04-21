import { BehaviorSubject, of } from "rxjs";
import { delay, switchMap } from "rxjs/operators";

export class LoadingHandler {
  private isLoading = new BehaviorSubject(false);

  isLoading$ = this.isLoading.pipe(
    switchMap(isLoading => {
      if (!isLoading) {
        return of(false);
      }
      return of(true).pipe(delay(1000));
    })
  );

  start() {
    this.isLoading.next(true);
  }

  complete() {
    this.isLoading.next(false);
  }
}
