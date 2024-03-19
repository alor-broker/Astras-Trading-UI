import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import { CommonParametersService } from "../../../services/common-parameters.service";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import { Side } from "../../../../../shared/models/enums/side.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PortfolioSubscriptionsService } from "../../../../../shared/services/portfolio-subscriptions.service";
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
  debounceTime,
  filter,
  map,
  startWith
} from "rxjs/operators";
import { PriceDiffHelper } from "../../../utils/price-diff.helper";
import { TimeInForce } from "../../../../../shared/models/orders/order.model";
import {
  NewLimitOrder,
  NewStopLimitOrder,
  SubmitOrderResult
} from "../../../../../shared/models/orders/new-order.model";
import { LessMore } from "../../../../../shared/models/enums/less-more.model";
import {
  NewLinkedOrder,
  OrderService
} from "../../../../../shared/services/orders/order.service";
import {
  ExecutionPolicy,
  SubmitGroupResult
} from "../../../../../shared/models/orders/orders-group.model";
import { BaseOrderFormComponent } from "../base-order-form.component";
import { EvaluationBaseProperties } from "../../../../../shared/models/evaluation-base-properties.model";
import {
  MarketType,
  PortfolioKey
} from "../../../../../shared/models/portfolio-key.model";
import { toInstrumentKey } from "../../../../../shared/utils/instruments";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import {
  addDays,
  addSeconds,
  startOfDay,
  toUnixTime
} from "../../../../../shared/utils/datetime";
import { MarketService } from "../../../../../shared/services/market.service";

@Component({
  selector: 'ats-limit-order-form',
  templateUrl: './limit-order-form.component.html',
  styleUrls: ['./limit-order-form.component.less']
})
export class LimitOrderFormComponent extends BaseOrderFormComponent implements OnInit, OnDestroy {
  expandAdvancedOptions = false;
  readonly evaluationRequest$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  readonly sides = Side;
  timeInForceEnum = TimeInForce;

  timezones$!: Observable<{ exchangeTimezone: string, displayTimezone: string}>;

  disabledDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    return toUnixTime(date) < toUnixTime(today);
  };

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
    price: this.formBuilder.control<number | null>(null),
    instrumentGroup: this.formBuilder.nonNullable.control<string>(''),
    timeInForce: this.formBuilder.control<TimeInForce | null>(null),
    orderEndUnixTime: this.formBuilder.control<Date | null>(null),
    isIceberg: this.formBuilder.nonNullable.control(false),
    icebergFixed: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    icebergVariance: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    topOrderPrice: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    topOrderSide: this.formBuilder.nonNullable.control(Side.Buy),
    bottomOrderPrice: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    bottomOrderSide: this.formBuilder.nonNullable.control(Side.Buy)
  });

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  @Input()
  initialValues: {
    price?: number;
    quantity?: number;
    bracket?: {
      topOrderPrice?: number | null;
      topOrderSide?: Side | null;
      bottomOrderPrice?: number | null;
      bottomOrderSide?: Side | null;
    };
  } | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly commonParametersService: CommonParametersService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly orderService: OrderService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly marketService: MarketService,
    protected readonly destroyRef: DestroyRef) {
    super(destroyRef);
  }

  get canSubmit(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    this.initInstrumentChange();
    this.initCommonParametersUpdate();
    this.initPriceDiffCalculation();
    this.initEvaluationUpdate();
    this.initFormFieldsCheck();
    this.initTimezones();
  }

  setQuantity(value: number): void {
    this.commonParametersService.setParameters({
      quantity: value
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluationRequest$.complete();
  }

  protected changeInstrument(instrument: Instrument, portfolioKey: PortfolioKey): void {
    this.form.reset(undefined, {emitEvent: true});

    this.setPriceValidators(this.form.controls.price, instrument);

    if (this.initialValues) {
      if (this.initialValues.price != null) {
        this.form.controls.price.setValue(this.initialValues.price);
      }

      if (this.initialValues.quantity != null) {
        this.form.controls.quantity.setValue(this.initialValues.quantity);
      }

      if (this.initialValues.bracket) {
        this.expandAdvancedOptions = true;
        if (this.initialValues.bracket.topOrderPrice != null) {
          this.form.controls.topOrderPrice.setValue(this.initialValues.bracket.topOrderPrice as number);
        }

        if (this.initialValues.bracket.topOrderSide) {
          this.form.controls.topOrderSide.setValue(this.initialValues.bracket.topOrderSide);
        }

        if (this.initialValues.bracket.bottomOrderPrice != null) {
          this.form.controls.bottomOrderPrice.setValue(this.initialValues.bracket.bottomOrderPrice as number);
        }

        if (this.initialValues.bracket.bottomOrderSide) {
          this.form.controls.bottomOrderSide.setValue(this.initialValues.bracket.bottomOrderSide);
        }
      }
    }

    this.form.controls.instrumentGroup.setValue(instrument.instrumentGroup ?? '');

    if(portfolioKey.marketType !== MarketType.Forward) {
      this.disableControl(this.form.controls.orderEndUnixTime);
    } else {
      this.enableControl(this.form.controls.orderEndUnixTime);
    }

    this.form.clearValidators();
    this.form.addValidators([
      AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
    ]);

    this.checkFieldsAvailability();
  }

  protected prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<SubmitOrderResult | SubmitGroupResult | null> {
    return this.timezoneConverterService.getConverter().pipe(
      take(1),
      switchMap(tc => {
        const limitOrder = this.getLimitOrder(instrument, side, tc);
        const bracketOrders = this.getBracketOrders(limitOrder);

        if (bracketOrders.length === 0) {
          return this.orderService.submitLimitOrder(limitOrder, portfolioKey.portfolio);
        } else {
          return this.orderService.submitOrdersGroup([
              {
                ...limitOrder,
                type: "Limit"
              },
              ...bracketOrders.map(x => ({
                ...x,
                type: "StopLimit"
              } as NewLinkedOrder))
            ],
            portfolioKey.portfolio,
            ExecutionPolicy.TriggerBracketOrders);
        }
      })
    );
  }

  private initCommonParametersUpdate(): void {
    this.commonParametersService.parameters$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(p => {
      if (p.price != null && this.form.controls.price.value !== p.price) {
        this.form.controls.price.setValue(p.price);
      }

      if (p.quantity != null && this.form.controls.quantity.value !== p.quantity) {
        this.form.controls.quantity.setValue(p.quantity);
      }
    });

    this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity, price: v.price})),
      distinctUntilChanged((prev, curr) => prev.price === curr.price && prev.quantity === curr.quantity),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.commonParametersService.setParameters({
        price: x.price,
        quantity: x.quantity
      });
    });
  }

  private getLimitOrder(instrument: Instrument, side: Side, timezoneConverter: TimezoneConverter): NewLimitOrder {
    const formValue = this.form.value;
    const limitOrder = {
      instrument: this.getOrderInstrument(formValue, instrument),
      price: Number(formValue.price!),
      quantity: Number(formValue.quantity!),
      side: side
    } as NewLimitOrder;

    if (!!formValue.timeInForce) {
      limitOrder.timeInForce = formValue.timeInForce;
    }

    if (formValue.icebergFixed != null) {
      limitOrder.icebergFixed = Number(formValue.icebergFixed);
    }

    if (formValue.icebergVariance != null) {
      limitOrder.icebergVariance = Number(formValue.icebergVariance);
    }

    if(formValue.orderEndUnixTime != null) {
      let selectedDate = timezoneConverter.terminalToUtc0Date(formValue.orderEndUnixTime, true);
      selectedDate = addDays(selectedDate, 1);
      selectedDate = addSeconds(selectedDate, -1);

      limitOrder.orderEndUnixTime = Math.ceil( selectedDate.getTime() / 1000);
    }

    return limitOrder;
  }

  private getBracketOrders(limitOrder: NewLimitOrder): NewStopLimitOrder[] {
    const formValue = this.form.value;

    const bracketOrders: NewStopLimitOrder[] = [];

    if (formValue.topOrderPrice != null) {
      bracketOrders.push({
        instrument: limitOrder.instrument,
        quantity: limitOrder.quantity,
        side: formValue.topOrderSide!,
        price: limitOrder.price,
        condition: LessMore.MoreOrEqual,
        triggerPrice: Number(formValue.topOrderPrice),
        activate: false
      });
    }

    if (formValue.bottomOrderPrice != null) {
      bracketOrders.push({
        instrument: limitOrder.instrument,
        quantity: limitOrder.quantity,
        side: formValue.bottomOrderSide!,
        price: limitOrder.price,
        condition: LessMore.LessOrEqual,
        triggerPrice: Number(formValue.bottomOrderPrice),
        activate: false
      });
    }

    return bracketOrders;
  }

  private initPriceDiffCalculation(): void {
    this.currentPriceDiffPercent$ = PriceDiffHelper.getPriceDiffCalculation(
      this.form.controls.price,
      this.getInstrumentWithPortfolio(),
      this.portfolioSubscriptionsService
    );
  }

  private initEvaluationUpdate(): void {
    const formChanges$ = this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity, price: v.price})),
      distinctUntilChanged((prev, curr) => prev.price === curr.price && prev.quantity === curr.quantity),
      startWith(null)
    );

    const positionChanges$ = this.getInstrumentWithPortfolio().pipe(
      switchMap(x => this.portfolioSubscriptionsService.getInstrumentPositionSubscription(x.portfolioKey, x.instrument)),
      map(p => p?.qtyTFutureBatch ?? 0),
      distinctUntilChanged((prev, curr) => prev === curr),
      startWith(0)
    );

    combineLatest([
      formChanges$,
      positionChanges$,
      this.isActivated$
    ]).pipe(
      filter(([, , isActivated]) => isActivated),
      takeUntilDestroyed(this.destroyRef),
      debounceTime(500)
    ).subscribe(() => this.updateEvaluation());
  }

  private updateEvaluation(): void {
    this.getInstrumentWithPortfolio().pipe(
      take(1)
    ).subscribe(x => {
      const formValue = this.form.value;
      if (formValue.price == null || formValue.quantity == null) {
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
        price: formValue.price as number,
        lotQuantity: formValue.quantity as number
      });
    });
  }

  private initFormFieldsCheck(): void {
    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.checkFieldsAvailability());
  }

  private checkFieldsAvailability(): void {
    if (this.form.controls.isIceberg.enabled && this.form.controls.isIceberg.value) {
      this.enableControl(this.form.controls.icebergFixed);
      this.enableControl(this.form.controls.icebergVariance);
    } else {
      this.disableControl(this.form.controls.icebergFixed);
      this.disableControl(this.form.controls.icebergVariance);
    }

    if(this.form.controls.orderEndUnixTime.enabled && this.form.controls.orderEndUnixTime.value !== null) {
      this.disableControl(this.form.controls.timeInForce);
    } else {
      this.enableControl(this.form.controls.timeInForce);
    }

    this.form.updateValueAndValidity();
  }

  private initTimezones(): void {
    this.timezones$ = combineLatest({
      marketSettings: this.marketService.getMarketSettings(),
      instrumentWithPortfolio: this.getInstrumentWithPortfolio(),
      timezoneConverter: this.timezoneConverterService.getConverter()
    }).pipe(
      map(x => {
        return {
          displayTimezone: x.timezoneConverter.getTimezone().name,
          exchangeTimezone: x.marketSettings.exchanges.find(e => e.exchange === x.instrumentWithPortfolio.portfolioKey.exchange)?.settings.timezone ?? ''
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
