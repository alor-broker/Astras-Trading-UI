import {
  Component,
  effect,
  inject,
  input
} from '@angular/core';
import {
  OrderFormBase,
  TargetInstrument
} from "../order-form-base";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import {
  filter,
  finalize,
  map
} from "rxjs/operators";
import {
  shareReplay,
  switchMap,
  take
} from "rxjs";
import { EvaluationService } from "../../../../../shared/services/evaluation.service";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import {
  AsyncPipe,
  CurrencyPipe,
  NgClass
} from "@angular/common";
import { InputNumberComponent } from "../../../../../shared/components/input-number/input-number.component";
import { NzButtonComponent } from "ng-zorro-antd/button";
import {
  NzColDirective,
  NzRowDirective
} from "ng-zorro-antd/grid";
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from "ng-zorro-antd/form";
import { ShortNumberComponent } from "../../../../../shared/components/short-number/short-number.component";
import { TranslocoDirective } from "@jsverse/transloco";
import { NewLimitOrder } from "../../../../../shared/models/orders/new-order.model";
import { ConfirmableOrderCommandsService } from "../../../../order-commands/services/confirmable-order-commands.service";

@Component({
  selector: 'ats-limit-order-form',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    InputNumberComponent,
    NzButtonComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzRowDirective,
    ReactiveFormsModule,
    ShortNumberComponent,
    TranslocoDirective,
    NgClass
  ],
  templateUrl: './limit-order-form.component.html',
  styleUrl: './limit-order-form.component.less',
})
export class LimitOrderFormComponent extends OrderFormBase {
  readonly orderPrice = input<number | null>();

  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    price: this.formBuilder.control<number | null>(null)
  });

  protected readonly orderParams$ = this.form.statusChanges.pipe(
    map(s => {
      if (s === "VALID") {
        return {
          price: this.form.value.price!,
          quantity: this.form.value.quantity ?? 1,
        };
      }

      return null;
    }),
    shareReplay(1)
  );

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

  private readonly evaluationService = inject(EvaluationService);

  protected readonly orderEvaluation$ = this.orderTargetChanges$.pipe(
    mapWith(
      () => this.orderParams$,
      (source, output) => ({
        ...source,
        params: output
      })
    ),
    filter(x => x.params != null),
    switchMap(x => {
      return this.evaluationService.evaluateOrder({
        portfolio: x.targetPortfolio.portfolio,
        instrument: {
          symbol: x.instrument.symbol,
          exchange: x.instrument.exchange,
          instrumentGroup: x.instrument.instrumentGroup,
        },
        price: x.params!.price,
        lotQuantity: x.params!.quantity,
      });
    })
  );

  constructor() {
    super();
    effect(() => {
      const orderTarget = this.orderTarget();

      this.form.reset();
      this.setPriceValidators(orderTarget.instrument);
    });

    effect(() => {
      const orderPrice = this.orderPrice();

      if (orderPrice != null) {
        this.form.controls.price.setValue(orderPrice);
      }
    });
  }

  protected setPriceValidators(instrument: TargetInstrument): void {
    const target = this.form.controls.price;

    target.clearValidators();
    target.addValidators([
      Validators.required,
      Validators.min(inputNumberValidation.negativeMin),
      Validators.max(inputNumberValidation.max),
      AtsValidators.priceStepMultiplicity(instrument.priceStep)
    ]);
  }

  protected submitOrder(): void {
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const side = this.side();
    const quantity = this.form.value.quantity ?? 1;
    const price = this.form.value.price!;
    const target = this.orderTarget();

    const limitOrder: NewLimitOrder = {
      instrument: {
        symbol: target.instrument.symbol,
        exchange: target.instrument.exchange,
        instrumentGroup: target.instrument.instrumentGroup
      },
      price,
      quantity,
      side
    };

    this.orderCommandService.submitLimitOrder(
      limitOrder,
      target.targetPortfolio
    ).pipe(
      take(1),
      finalize(() => this.submitting.set(false))
    ).subscribe(result => {
      if (result.isSuccess) {
        this.submitted.emit();
      }
    });
  }
}
