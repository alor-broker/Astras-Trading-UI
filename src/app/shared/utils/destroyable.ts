import { Subject } from 'rxjs';

export class Destroyable {
  readonly destroyed$ = new Subject<boolean>();

  private onDestroyActions: (() => void)[] = [];

  destroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();

    this.onDestroyActions.forEach(x => x());
  }

  onDestroy(action: () => void) {
    this.onDestroyActions.push(action);
  }
}
