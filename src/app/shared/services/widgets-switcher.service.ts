import {
  Injectable,
  OnDestroy
} from '@angular/core';
import { BehaviorSubject, } from "rxjs";

export interface WidgetActivationArgs {
  identifier: {
    typeId?: string;
  };
  parameters?: any;
  sourceWidgetInstanceId?: string;
}

export type SwitchEvent = { curr: WidgetActivationArgs | null, prev: WidgetActivationArgs | null } | null;

@Injectable({
  providedIn: 'root'
})
export class WidgetsSwitcherService implements OnDestroy {
  private activation: WidgetActivationArgs | null = null;

  private readonly switchEvents$ = new BehaviorSubject<SwitchEvent>(null);

  public readonly switchSubscription$ = this.switchEvents$.asObservable();

  ngOnDestroy(): void {
    this.switchEvents$.complete();
  }

  activateWidget(args: WidgetActivationArgs): void {
    const newActivation = Object.freeze(JSON.parse(JSON.stringify(args)) as WidgetActivationArgs);

    this.switchEvents$.next({
      prev: this.activation,
      curr: newActivation
    });

    this.activation = newActivation;
  }

  returnToSource(): void {
    if (this.activation != null) {
      this.switchEvents$.next({
        prev: this.activation,
        curr: null
      });
    }
  }
}
