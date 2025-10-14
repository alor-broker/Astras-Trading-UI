import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  shareReplay,
  take,
  tap
} from "rxjs";
import { map } from "rxjs/operators";
import { ArrayHelper } from "../utils/array-helper";

export interface WidgetTarget {
  typeId: string;
  instanceId?: string;
  parameters?: any;
}

export interface NavigationState {
  isFinal?: boolean;
  widgetTarget: WidgetTarget;
}
@Injectable({
  providedIn: 'root'
})
export class NavigationStackService {
  private readonly state$ = new BehaviorSubject<NavigationState[]>([]);

  readonly currentState$ = this.state$.pipe(
    tap(s => console.debug(s)),
    filter(s => s.length > 0),
    map(s => ArrayHelper.lastOrNull(s)),
    filter(s => s != null),
    shareReplay(1)
  );

  pushState(state: NavigationState): void {
    this.updateState(currentState => {
      const updatedState = (currentState ?? []);
      updatedState.push(state);
      return updatedState;
    });
  }

  popState(): void {
    this.updateState(currentState => {
      const updatedState = (currentState ?? []);
      const currentHead = ArrayHelper.lastOrNull(updatedState);
      if(currentHead != null && !(currentHead.isFinal ?? false)) {
        updatedState.pop();
      }

      return updatedState;
    });
  }

  private updateState(updater: (currentState: NavigationState[] | null) => NavigationState[]): void {
    this.state$.pipe(
      take(1)
    ).subscribe(s => {
      this.state$.next([...updater(s)]);
    });
  }
}
