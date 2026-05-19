import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  ViewEncapsulation
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
import {
  AsyncPipe,
  CurrencyPipe
} from "@angular/common";
import {NzButtonComponent} from "ng-zorro-antd/button";
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
import {TranslocoDirective} from "@jsverse/transloco";
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {priceStepMultiplicity} from '@terminal-core-lib/features/forms/validators/price-step-multiplicity';
import {NewLimitOrder} from '@terminal-core-lib/features/orders/types/new-order.types';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {NearestTradingSessionComponent} from '@terminal-widgets-lib/widgets/order-commands/components/nearest-trading-session/nearest-trading-session';

@Component({
  selector: 'ats-trade-screen-limit-order-form',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    NzButtonComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzRowDirective,
    ReactiveFormsModule,
    TranslocoDirective,
    InputNumber,
    ShortNumber,
    NearestTradingSessionComponent,
  ],
  templateUrl: './trade-screen-limit-order-form.html',
  styleUrl: './trade-screen-limit-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TradeScreenLimitOrderForm extends OrderFormBase {
  readonly orderPrice = input<number | null>();

  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(InputNumberValidation.max)
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
      Validators.min(InputNumberValidation.minNegative),
      Validators.max(InputNumberValidation.max),
      priceStepMultiplicity(instrument.priceStep)
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
