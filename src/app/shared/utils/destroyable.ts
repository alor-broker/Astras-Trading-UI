import {Subject} from 'rxjs';

export class Destroyable extends Subject<void> {
  private onDestroyActions: (() => void)[] = [];

  destroy() {
    this.next();
    this.complete();

    this.onDestroyActions.forEach(x => x());
  }

  onDestroy(action: () => void) {
    this.onDestroyActions.push(action);
  }
}
