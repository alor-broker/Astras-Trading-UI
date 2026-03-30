import {
  Component,
  input,
  model,
  output
} from "@angular/core";
import { TargetPortfolio } from "../../../order-commands/services/confirmable-order-commands.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { shareReplay } from "rxjs";
import { Side } from "../../../../shared/models/enums/side.model";

export interface TargetInstrument {
  symbol: string;
  exchange: string;
  instrumentGroup?: string | null;
  priceStep: number;
  lotSize: number;
}

export interface OrderTarget {
  targetPortfolio: TargetPortfolio;
  instrument: TargetInstrument;
}

@Component({
  template: ''
})
export abstract class OrderFormBase {
  readonly side = input.required<Side>();

  readonly orderTarget = input.required<OrderTarget>();

  readonly submitted = output();

  protected readonly Sides = Side;

  protected readonly orderTargetChanges$ = toObservable(this.orderTarget).pipe(
    shareReplay(1),
  );

  protected readonly submitting = model(false);
}
