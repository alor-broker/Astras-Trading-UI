import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  subscribeOn,
  switchMap,
  take
} from "rxjs";
import {
  debounceTime,
  filter,
  map,
  startWith
} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {NzDatePickerComponent} from 'ng-zorro-antd/date-picker';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {
  AsyncPipe,
  DecimalPipe,
  KeyValuePipe
} from '@angular/common';
import {BaseOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/base-order-form';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {SingleOrderEvaluation} from '@terminal-core-lib/features/orders/services/evaluation-service.types';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {
  OrderType,
  TimeInForce
} from '@terminal-core-lib/features/orders/types/orders.types';
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewStopMarketOrder,
  OrderCommandResult,
  Reason
} from '@terminal-core-lib/features/orders/types/new-order.types';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {
  addDays,
  addSeconds,
  getUnixTime,
  startOfDay
} from 'date-fns';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {LimitOrderConfig} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {
  Instrument,
  Market
} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {notBiggerThan} from '@terminal-core-lib/features/forms/validators/not-bigger-than';
import {
  ExecutionPolicy,
  SubmitGroupResult
} from '@terminal-core-lib/features/orders/types/order-group.types';
import {TimezoneConverter} from '@terminal-core-lib/features/timezones/utils/timezone-converter';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {PriceDiffHelper} from '@terminal-widgets-lib/widgets/order-commands/utils/price-diff.helper';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {OrderEvaluation} from '@terminal-widgets-lib/widgets/order-commands/components/order-evaluation/order-evaluation';
import {BuySellButtons} from '@terminal-widgets-lib/widgets/order-commands/components/buy-sell-buttons/buy-sell-buttons';
import {NearestTradingSessionComponent} from '@terminal-widgets-lib/widgets/order-commands/components/nearest-trading-session/nearest-trading-session';

@Component({
  selector: 'ats-limit-order-form',
  templateUrl: './limit-order-form.html',
  styleUrls: ['./limit-order-form.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzColDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzTooltipDirective,
    NzSelectComponent,
    NzOptionComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzDatePickerComponent,
    NzTypographyComponent,
    NzCheckboxComponent,
    AsyncPipe,
    DecimalPipe,
    KeyValuePipe,
    InputNumber,
    ShortNumber,
    InstrumentBoardSelect,
    OrderEvaluation,
    BuySellButtons,
    NearestTradingSessionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LimitOrderForm extends BaseOrderForm implements OnInit, OnDestroy {
  expandAdvancedOptions = false;

  readonly evaluationRequest$ = new BehaviorSubject<SingleOrderEvaluation | null>(null);

  readonly sides = Side;

  timeInForceEnum = TimeInForce;

  reasonEnum = Reason;

  timezones$!: Observable<{ exchangeTimezone: string, displayTimezone: string }>;

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  readonly initialValues = input<{
    price?: number;
    quantity?: number;
    bracket?: {
      topOrderPrice?: number | null;
      topOrderSide?: Side | null;
      bottomOrderPrice?: number | null;
      bottomOrderSide?: Side | null;
    };
  } | null>(null);

  readonly limitOrderConfig = input.required<LimitOrderConfig>();

  private readonly formBuilder = inject(FormBuilder);

  form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
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
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    icebergVariance: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    topOrderPrice: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(InputNumberValidation.minNegative),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    topOrderSide: this.formBuilder.control<Side | null>(null, {validators: [Validators.required]}),
    bottomOrderPrice: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(InputNumberValidation.minNegative),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    bottomOrderSide: this.formBuilder.control<Side | null>(null, {validators: [Validators.required]}),
    reason: this.formBuilder.control<Reason | null>(null)
  });

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly marketService = inject(MarketService);

  get canSubmit(): boolean {
    return this.form.valid;
  }

  disabledDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    return getUnixTime(date) < getUnixTime(today);
  };

  ngOnInit(): void {
    this.initInstrumentChange();
    this.initCommonParametersUpdate();
    this.initPriceDiffCalculation();
    this.initEvaluationUpdate();
    this.initFormFieldsCheck();
    this.initTimezones();
  }

  setQuantity(value: number): void {
    this.setCommonParameters({
      quantity: value
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluationRequest$.complete();
  }

  public updateEvaluation(): void {
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
          ...InstrumentKeyHelper.toInstrumentKey(x.instrument),
          instrumentGroup: formValue.instrumentGroup ?? x.instrument.instrumentGroup
        },
        instrumentCurrency: x.instrument.currency,
        price: formValue.price as number,
        lotQuantity: formValue.quantity as number
      });
    });
  }

  protected changeInstrument(instrument: Instrument): void {
    this.form.reset(undefined, {emitEvent: true});

    this.setPriceValidators(this.form.controls.price, instrument);

    const initialValues = this.initialValues();
    if (initialValues != null) {
      if (initialValues.price != null) {
        this.form.controls.price.setValue(initialValues.price);
      }

      if (initialValues.quantity != null) {
        this.form.controls.quantity.setValue(initialValues.quantity);
      }

      if (initialValues.bracket) {
        this.expandAdvancedOptions = true;
        if (initialValues.bracket.topOrderPrice != null) {
          this.form.controls.topOrderPrice.setValue(initialValues.bracket.topOrderPrice as number);
        }

        if (initialValues.bracket.topOrderSide != null) {
          this.form.controls.topOrderSide.setValue(initialValues.bracket.topOrderSide);
        }

        if (initialValues.bracket.bottomOrderPrice != null) {
          this.form.controls.bottomOrderPrice.setValue(initialValues.bracket.bottomOrderPrice as number);
        }

        if (initialValues.bracket.bottomOrderSide != null) {
          this.form.controls.bottomOrderSide.setValue(initialValues.bracket.bottomOrderSide);
        }
      }
    }

    this.form.controls.instrumentGroup.setValue(instrument.instrumentGroup ?? '');

    if (instrument.market !== Market.Forts) {
      this.disableControl(this.form.controls.orderEndUnixTime);
    } else {
      this.enableControl(this.form.controls.orderEndUnixTime);
    }

    this.form.clearValidators();
    this.form.addValidators([
      notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
    ]);

    this.checkFieldsAvailability();
  }

  protected prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<OrderCommandResult | SubmitGroupResult | null> {
    return this.timezoneConverterService.getConverter().pipe(
      take(1),
      switchMap(tc => {
        const limitOrder = this.getLimitOrder(instrument, side, tc);
        const bracketOrders = this.getBracketOrders(limitOrder);

        if (bracketOrders.length === 0) {
          return this.orderCommandService.submitLimitOrder(limitOrder, portfolioKey);
        } else {
          return this.orderCommandService.submitOrdersGroup([
              {
                ...limitOrder,
                type: OrderType.Limit
              },
              ...bracketOrders.map(x => ({
                ...x,
                type: OrderType.StopMarket
              } as NewLinkedOrder))
            ],
            portfolioKey,
            ExecutionPolicy.TriggerBracketOrders);
        }
      })
    );
  }

  private initCommonParametersUpdate(): void {
    this.getCommonParameters().pipe(
      takeUntilDestroyed(this.destroyRef),
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
      this.setCommonParameters({
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

    if (formValue.timeInForce != null) {
      limitOrder.timeInForce = formValue.timeInForce;
    }

    if (formValue.icebergFixed != null) {
      limitOrder.icebergFixed = Number(formValue.icebergFixed);
    }

    if (formValue.icebergVariance != null) {
      limitOrder.icebergVariance = Number(formValue.icebergVariance);
    }

    if (formValue.orderEndUnixTime != null) {
      let selectedDate = timezoneConverter.terminalToUtc0Date(formValue.orderEndUnixTime, true);
      selectedDate = addDays(selectedDate, 1);
      selectedDate = addSeconds(selectedDate, -1);

      limitOrder.orderEndUnixTime = Math.ceil(selectedDate.getTime() / 1000);
    }

    if (formValue.reason != null) {
      limitOrder.reason = formValue.reason;
    }

    return limitOrder;
  }

  private getBracketOrders(limitOrder: NewLimitOrder): NewStopMarketOrder[] {
    const formValue = this.form.value;

    const bracketOrders: NewStopMarketOrder[] = [];

    if (formValue.topOrderPrice != null && formValue.topOrderSide != null) {
      bracketOrders.push({
        instrument: limitOrder.instrument,
        quantity: limitOrder.quantity,
        side: formValue.topOrderSide,
        condition: Condition.MoreOrEqual,
        triggerPrice: Number(formValue.topOrderPrice),
        activate: false
      });
    }

    if (formValue.bottomOrderPrice != null && formValue.bottomOrderSide != null) {
      bracketOrders.push({
        instrument: limitOrder.instrument,
        quantity: limitOrder.quantity,
        side: formValue.bottomOrderSide,
        condition: Condition.LessOrEqual,
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
      this.activatedChanges$
    ]).pipe(
      filter(([, , isActivated]) => isActivated),
      takeUntilDestroyed(this.destroyRef),
      debounceTime(500)
    ).subscribe(() => this.updateEvaluation());
  }

  private initFormFieldsCheck(): void {
    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.checkFieldsAvailability());

    this.form.controls.topOrderPrice.valueChanges.pipe(
      filter(v => v != null),
      takeUntilDestroyed(this.destroyRef),
      debounceTime(1000),
      subscribeOn(asyncScheduler)
    ).subscribe(() => {
      this.form.controls.topOrderSide.markAsTouched();
      this.form.controls.topOrderSide.updateValueAndValidity();
    });

    this.form.controls.bottomOrderPrice.valueChanges.pipe(
      filter(v => v != null),
      takeUntilDestroyed(this.destroyRef),
      debounceTime(1000),
      subscribeOn(asyncScheduler)
    ).subscribe(() => {
      this.form.controls.bottomOrderSide.markAsTouched();
      this.form.controls.bottomOrderSide.updateValueAndValidity();
    });
  }

  private checkFieldsAvailability(): void {
    if (this.form.controls.isIceberg.enabled && this.form.controls.isIceberg.value) {
      this.enableControl(this.form.controls.icebergFixed);
      this.enableControl(this.form.controls.icebergVariance);
    } else {
      this.disableControl(this.form.controls.icebergFixed);
      this.disableControl(this.form.controls.icebergVariance);
    }

    if (this.form.controls.orderEndUnixTime.enabled && this.form.controls.orderEndUnixTime.value !== null) {
      this.disableControl(this.form.controls.timeInForce);
    } else {
      this.enableControl(this.form.controls.timeInForce);
    }

    if (!this.limitOrderConfig().isBracketsSupported) {
      this.disableControl(this.form.controls.topOrderPrice);
      this.disableControl(this.form.controls.topOrderSide);
      this.disableControl(this.form.controls.bottomOrderPrice);
      this.disableControl(this.form.controls.bottomOrderSide);
    } else {
      if (this.form.controls.topOrderPrice.value != null) {
        this.enableControl(this.form.controls.topOrderSide);
      } else {
        this.disableControl(this.form.controls.topOrderSide);
      }

      if (this.form.controls.bottomOrderPrice.value != null) {
        this.enableControl(this.form.controls.bottomOrderSide);
      } else {
        this.disableControl(this.form.controls.bottomOrderSide);
      }
    }

    if (this.limitOrderConfig().unsupportedFields.reason) {
      this.disableControl(this.form.controls.reason);
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
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
