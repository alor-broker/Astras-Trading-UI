import {
  Component,
  effect,
  inject
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
import {inputNumberValidation} from "../../../../../shared/utils/validation-options";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzFormModule} from "ng-zorro-antd/form";
import {InputNumberComponent} from "../../../../../shared/components/input-number/input-number.component";
import {ShortNumberComponent} from "../../../../../shared/components/short-number/short-number.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {
  AsyncPipe,
  CurrencyPipe
} from "@angular/common";
import {QuotesService} from "../../../../../shared/services/quotes.service";
import {EvaluationService} from "../../../../../shared/services/evaluation.service";
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
import {ConfirmableOrderCommandsService} from "../../../../order-commands/services/confirmable-order-commands.service";
import {NewMarketOrder} from "../../../../../shared/models/orders/new-order.model";
import { ApplicationStatusService } from "../../../../../shared/services/application-status.service";
import { NearestTradingSessionComponent } from "../../../../order-commands/components/nearest-trading-session/nearest-trading-session.component";

@Component({
  selector: 'ats-market-order-form',
  imports: [
    TranslocoDirective,
    NzFormModule,
    ReactiveFormsModule,
    InputNumberComponent,
    ShortNumberComponent,
    NzButtonComponent,
    AsyncPipe,
    CurrencyPipe,
    NearestTradingSessionComponent
],
  templateUrl: './market-order-form.component.html',
  styleUrl: './market-order-form.component.less',
})
export class MarketOrderFormComponent extends OrderFormBase {
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
      return this.quotesService.getQuotes(instrument.symbol, instrument.exchange, instrument.instrumentGroup).pipe(
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
