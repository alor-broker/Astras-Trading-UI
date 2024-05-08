import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { BaseOrderFormComponent } from "../base-order-form.component";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { CommonParametersService } from "../../../services/common-parameters.service";
import { PortfolioSubscriptionsService } from "../../../../../shared/services/portfolio-subscriptions.service";
import { OrderService } from "../../../../../shared/services/orders/order.service";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { EvaluationBaseProperties } from "../../../../../shared/models/evaluation-base-properties.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  debounceTime,
  filter,
  map,
  startWith
} from "rxjs/operators";
import { QuotesService } from "../../../../../shared/services/quotes.service";
import { Side } from "../../../../../shared/models/enums/side.model";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";
import { SubmitGroupResult } from "../../../../../shared/models/orders/orders-group.model";
import { SubmitOrderResult } from "../../../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../../../shared/utils/instruments";

@Component({
  selector: 'ats-market-order-form',
  templateUrl: './market-order-form.component.html',
  styleUrls: ['./market-order-form.component.less']
})
export class MarketOrderFormComponent extends BaseOrderFormComponent implements OnInit, OnDestroy {
  readonly evaluationRequest$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  readonly sides = Side;

  @Input()
  initialValues: {
    quantity?: number;
  } | null = null;

  form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    instrumentGroup: this.formBuilder.nonNullable.control<string>(''),
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    protected commonParametersService: CommonParametersService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly quotesService: QuotesService,
    private readonly orderService: OrderService,
    protected readonly destroyRef: DestroyRef) {
    super(commonParametersService, destroyRef);
  }

  get canSubmit(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    this.initInstrumentChange();
    this.initCommonParametersUpdate();
    this.initEvaluationUpdate();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluationRequest$.complete();
  }

  setQuantity(value: number): void {
    this.setCommonParameters({
      quantity: value
    });
  }

  protected changeInstrument(newInstrument: Instrument): void {
    this.form.reset();

    if (this.initialValues) {
      if (this.initialValues.quantity != null) {
        this.form.controls.quantity.setValue(this.initialValues.quantity);
      }
    }

    this.form.controls.instrumentGroup.setValue(newInstrument.instrumentGroup ?? '');
  }

  protected prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<SubmitOrderResult | SubmitGroupResult> {
    const formValue = this.form.value;

    return this.orderService.submitMarketOrder({
        instrument: this.getOrderInstrument(formValue, instrument),
        quantity: Number(formValue.quantity),
        side: side
      },
      portfolioKey.portfolio
    );
  }

  private initCommonParametersUpdate(): void {
    this.getCommonParameters().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(p => {
      if (p.quantity != null && this.form.controls.quantity.value !== p.quantity) {
        this.form.controls.quantity.setValue(p.quantity);
      }
    });

    this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity})),
      distinctUntilChanged((prev, curr) => prev.quantity === curr.quantity),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.setCommonParameters({
        quantity: x.quantity
      });
    });
  }

  private initEvaluationUpdate(): void {
    const formChanges$ = this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity})),
      distinctUntilChanged((prev, curr) => prev.quantity === curr.quantity),
      startWith(null)
    );

    const getInstrumentWithPortfolio$ = this.getInstrumentWithPortfolio().pipe(
      shareReplay(1)
    );

    const positionChanges$ = this.getInstrumentWithPortfolio().pipe(
      switchMap(x => this.portfolioSubscriptionsService.getInstrumentPositionSubscription(x.portfolioKey, x.instrument)),
      map(p => p?.qtyTFutureBatch ?? 0),
      distinctUntilChanged((prev, curr) => prev === curr),
      startWith(0)
    );

    const lastPrice$ = getInstrumentWithPortfolio$.pipe(
      switchMap(x => this.quotesService.getQuotes(x.instrument.symbol, x.instrument.exchange, (this.form.controls.instrumentGroup.value as string | undefined) ?? x.instrument.instrumentGroup)),
      map(q => q.last_price),
      distinctUntilChanged((prev, curr) => prev === curr),
      shareReplay(1)
    );

    combineLatest([
      formChanges$,
      positionChanges$,
      lastPrice$,
      this.isActivated$
    ]).pipe(
      filter(([, , , isActivated]) => isActivated),
      takeUntilDestroyed(this.destroyRef),
      debounceTime(500)
    ).subscribe(([, , lastPrice]) => this.updateEvaluation(lastPrice));
  }

  private updateEvaluation(lastPrice: number): void {
    this.getInstrumentWithPortfolio().pipe(
      take(1)
    ).subscribe(x => {
      const formValue = this.form.value;
      if (!(formValue.quantity ?? 0)) {
        this.evaluationRequest$.next(null);
        return;
      }

      this.evaluationRequest$.next({
        portfolio: x.portfolioKey.portfolio,
        instrument: {
          ...toInstrumentKey(x.instrument),
          instrumentGroup: formValue.instrumentGroup ?? x.instrument.instrumentGroup
        },
        instrumentCurrency: x.instrument.currency,
        price: lastPrice,
        lotQuantity: formValue.quantity!
      });
    });
  }
}
