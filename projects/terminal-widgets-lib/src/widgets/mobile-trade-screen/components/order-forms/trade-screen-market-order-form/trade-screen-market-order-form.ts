import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
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
import {TranslocoDirective} from "@jsverse/transloco";
import {NzFormModule} from "ng-zorro-antd/form";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {
  AsyncPipe,
  CurrencyPipe
} from "@angular/common";
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  debounceTime,
  filter,
  finalize,
  map,
  startWith
} from "rxjs/operators";
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {NewMarketOrder} from '@terminal-core-lib/features/orders/types/new-order.types';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {NearestTradingSessionComponent} from '@terminal-widgets-lib/widgets/order-commands/components/nearest-trading-session/nearest-trading-session';

@Component({
  selector: 'ats-trade-screen-market-order-form',
  imports: [
    TranslocoDirective,
    NzFormModule,
    ReactiveFormsModule,
    NzButtonComponent,
    AsyncPipe,
    CurrencyPipe,
    InputNumber,
    ShortNumber,
    NearestTradingSessionComponent,
  ],
  templateUrl: './trade-screen-market-order-form.html',
  styleUrl: './trade-screen-market-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TradeScreenMarketOrderForm extends OrderFormBase {
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
  });

  protected readonly quantity$ = this.form.statusChanges.pipe(
    map(s => {
      if (s === "VALID") {
        return this.form.value.quantity ?? 1;
      }

      return null;
    }),
    startWith(this.form.value.quantity ?? null),
    shareReplay(1)
  );

  private readonly quotesService = inject(QuotesService);

  private readonly evaluationService = inject(EvaluationService);

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  constructor() {
    super();
    effect(() => {
      this.orderTarget();
      this.form.reset();
    });
  }

  protected submitOrder(): void {
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const side = this.side();
    const quantity = this.form.value.quantity ?? 1;
    const target = this.orderTarget();

    const marketOrder: NewMarketOrder = {
      instrument: {
        symbol: target.instrument.symbol,
        exchange: target.instrument.exchange,
        instrumentGroup: target.instrument.instrumentGroup
      },
      quantity,
      side
    };

    this.orderCommandService.submitMarketOrder(
      marketOrder,
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

  private readonly getLastPrice = (instrument: TargetInstrument): Observable<number> => {
    return defer(() => {
      return this.quotesService.getQuotesSubscription(instrument.symbol, instrument.exchange, instrument.instrumentGroup).pipe(
        map(q => q.last_price),
        distinctUntilChanged((prev, curr) => prev === curr),
        shareReplay({bufferSize: 1, refCount: true})
      );
    });
  };

  protected readonly orderEvaluation$ = this.orderTargetChanges$.pipe(
    switchMap(t => {
      return combineLatest({
        orderTarget: of(t),
        quantity: this.quantity$,
        instrumentLastPrice: this.getLastPrice(t.instrument),
        isApplicationActive: this.applicationStatusService.isActive$
      });
    }),
    filter(x => x.instrumentLastPrice != null && x.isApplicationActive),
    debounceTime(500),
    switchMap(x => {
      return this.evaluationService.evaluateOrder({
        portfolio: x.orderTarget.targetPortfolio.portfolio,
        instrument: {
          symbol: x.orderTarget.instrument.symbol,
          exchange: x.orderTarget.instrument.exchange,
          instrumentGroup: x.orderTarget.instrument.instrumentGroup,
        },
        price: x.instrumentLastPrice,
        lotQuantity: x.quantity ?? 1
      });
    })
  );
}
