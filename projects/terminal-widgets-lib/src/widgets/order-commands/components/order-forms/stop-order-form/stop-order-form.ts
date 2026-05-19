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
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  switchMap,
  take
} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  debounceTime,
  filter,
  map
} from "rxjs/operators";
import {PriceDiffHelper} from "../../../utils/price-diff.helper";
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
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzDatePickerComponent} from 'ng-zorro-antd/date-picker';
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from 'ng-zorro-antd/radio';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {
  AsyncPipe,
  DecimalPipe,
  KeyValuePipe
} from '@angular/common';
import {BaseOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/base-order-form';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {
  OrderType,
  TimeInForce
} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {
  addMonths,
  getUnixTime,
  startOfDay
} from 'date-fns';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {notBiggerThan} from '@terminal-core-lib/features/forms/validators/not-bigger-than';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {
  NewLinkedOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from '@terminal-core-lib/features/orders/types/new-order.types';
import {
  ExecutionPolicy,
  SubmitGroupResult
} from '@terminal-core-lib/features/orders/types/order-group.types';
import {TimezoneConverter} from '@terminal-core-lib/features/timezones/utils/timezone-converter';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {BuySellButtons} from '@terminal-widgets-lib/widgets/order-commands/components/buy-sell-buttons/buy-sell-buttons';

@Component({
  selector: 'ats-stop-order-form',
  templateUrl: './stop-order-form.html',
  styleUrls: ['./stop-order-form.less'],
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
    NzSelectComponent,
    NzOptionComponent,
    NzDatePickerComponent,
    NzRadioGroupComponent,
    NzRadioComponent,
    NzTooltipDirective,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzCheckboxComponent,
    NzTypographyComponent,
    AsyncPipe,
    DecimalPipe,
    KeyValuePipe,
    InputNumber,
    ShortNumber,
    BuySellButtons
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class StopOrderForm extends BaseOrderForm implements OnInit, OnDestroy {
  readonly sides = Side;

  canSelectNow = true;

  readonly conditionType = Condition;

  readonly timeInForceEnum = TimeInForce;

  readonly initialValues = input<{
    price?: number;
    quantity?: number;
    stopOrder?: Partial<{
      triggerPrice: number | null;
      condition: Condition | null;
      limit: boolean | null;
      // Set to true to prevent parameters recalculation.
      // For example, trigger price, condition and limit order price should not be recalculated when form is called from scalper orderbook
      disableCalculations: boolean | null;
    }>;
  } | null>(null);

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  protected readonly input = input;

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
    triggerPrice: this.formBuilder.control<number | null>(null),
    condition: this.formBuilder.nonNullable.control(Condition.More),
    stopEndUnixTime: this.formBuilder.control<Date | null>(null),
    withLimit: this.formBuilder.nonNullable.control(false),
    price: this.formBuilder.control<number | null>(null),
    timeInForce: this.formBuilder.control<TimeInForce | null>(null),

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

    allowLinkedOrder: this.formBuilder.nonNullable.control(false),
    linkedOrder: this.formBuilder.group({
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
      triggerPrice: this.formBuilder.control<number | null>(null),
      condition: this.formBuilder.control<Condition | null>(
        null,
        {
          validators: [Validators.required]
        }
      ),
      stopEndUnixTime: this.formBuilder.control<Date | null>(null),
      withLimit: this.formBuilder.nonNullable.control(false),
      price: this.formBuilder.control<number | null>(null),
      side: this.formBuilder.control<Side | null>(
        null,
        {
          validators: [Validators.required]
        }
      ),
    })
  });

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

  private readonly quotesService = inject(QuotesService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  get canSubmit(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    this.initInstrumentChange();
    this.initCommonParametersUpdate();
    this.initPriceDiffCalculation();
    this.initFormFieldsCheck();
    this.initFieldDependencies();
  }

  disabledDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    return getUnixTime(date) < getUnixTime(today);
  };

  protected changeInstrument(newInstrument: Instrument): void {
    this.form.reset(undefined, {emitEvent: true});

    this.setPriceValidators(this.form.controls.triggerPrice, newInstrument);
    this.setPriceValidators(this.form.controls.price, newInstrument);

    this.setPriceValidators(this.form.controls.linkedOrder.controls.triggerPrice, newInstrument);
    this.setPriceValidators(this.form.controls.linkedOrder.controls.price, newInstrument);

    const initialValues = this.initialValues();
    if (initialValues) {
      if (initialValues.quantity != null) {
        this.form.controls.quantity.setValue(initialValues.quantity);
      }

      if (initialValues.price != null) {
        this.form.controls.triggerPrice.setValue(initialValues.price);
        this.form.controls.price.setValue(initialValues.price);
      }

      if (initialValues.stopOrder) {
        if (initialValues.stopOrder.triggerPrice != null) {
          this.form.controls.triggerPrice.setValue(initialValues.stopOrder.triggerPrice);
        }

        if (initialValues.stopOrder.limit != null) {
          this.form.controls.withLimit.setValue(initialValues.stopOrder.limit);
        }

        if (initialValues.stopOrder.condition != null) {
          this.form.controls.condition.setValue(initialValues.stopOrder.condition);
        }
      }
    }

    this.form.clearValidators();
    this.form.addValidators([
      notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
    ]);

    this.timezoneConverterService.getConverter().pipe(
      take(1)
    ).subscribe(tc => {
      const stopTime = tc.toTerminalUtcDate(getUnixTime(addMonths(this.getUtcNow(), 1)));

      this.form.controls.stopEndUnixTime.setValue(stopTime);
      this.form.controls.linkedOrder.controls.stopEndUnixTime.setValue(stopTime);

      this.checkNowTimeSelection(tc);
    });

    this.checkFieldsAvailability();
  }

  protected prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<OrderCommandResult | SubmitGroupResult | null> {
    return this.timezoneConverterService.getConverter().pipe(
      take(1),
      switchMap(tc => {
        const formValue = this.form.value;

        if ((formValue.allowLinkedOrder ?? false) && !!formValue.linkedOrder) {
          const baseOrder = (formValue.withLimit ?? false)
            ? {
              ...this.getStopLimitOrder(instrument, side, formValue, tc),
              side,
              type: OrderType.StopLimit
            }
            : {
              ...this.getStopMarketOrder(instrument, side, formValue, tc),
              side,
              type: OrderType.StopMarket
            };

          const linkedOrder: NewLinkedOrder = (formValue.linkedOrder.withLimit ?? false)
            ? {
              ...this.getStopLimitOrder(instrument, side, formValue.linkedOrder, tc),
              side: formValue.linkedOrder.side!,
              type: OrderType.StopLimit
            }
            : {
              ...this.getStopMarketOrder(instrument, side, formValue.linkedOrder, tc),
              side: formValue.linkedOrder.side!,
              type: OrderType.StopMarket
            };

          return this.orderCommandService.submitOrdersGroup(
            [
              baseOrder,
              linkedOrder
            ] as NewLinkedOrder[],
            portfolioKey,
            ExecutionPolicy.OnExecuteOrCancel
          );
        } else {
          if (formValue.withLimit === true) {
            return this.orderCommandService.submitStopLimitOrder(
              this.getStopLimitOrder(instrument, side, formValue, tc),
              portfolioKey
            );
          } else {
            return this.orderCommandService.submitStopMarketOrder(
              this.getStopMarketOrder(instrument, side, formValue, tc),
              portfolioKey
            );
          }
        }
      })
    );
  }

  private getUtcNow(): Date {
    const now = new Date();
    return new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000);
  }

  private initCommonParametersUpdate(): void {
    this.getCommonParameters().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(p => {
      if (p.quantity != null) {
        const newQuantity = p.quantity;
        if (this.form.controls.quantity.value !== newQuantity) {
          this.form.controls.quantity.setValue(newQuantity);
        }

        if (this.form.controls.linkedOrder.controls.quantity.value !== newQuantity) {
          this.form.controls.linkedOrder.controls.quantity.setValue(newQuantity);
        }
      }

      if (p.price != null) {
        const newPrice = p.price;

        if (this.form.controls.triggerPrice.value !== newPrice) {
          this.form.controls.triggerPrice.setValue(newPrice!);
        }

        if (this.form.controls.price.value !== newPrice) {
          this.form.controls.price.setValue(newPrice!);
        }

        if (this.form.controls.linkedOrder.controls.triggerPrice.value !== newPrice) {
          this.form.controls.linkedOrder.controls.triggerPrice.setValue(newPrice!);
        }

        if (this.form.controls.linkedOrder.controls.price.value !== newPrice) {
          this.form.controls.linkedOrder.controls.price.setValue(newPrice!);
        }
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

  private getStopMarketOrder(
    instrument: Instrument,
    side: Side,
    formValue: {
      quantity?: number;
      triggerPrice?: number | null;
      condition?: Condition | null;
      stopEndUnixTime?: Date | null;
    },
    timezoneConverter: TimezoneConverter
  ): NewStopMarketOrder {
    return {
      instrument: InstrumentKeyHelper.toInstrumentKey(instrument),
      quantity: Number(formValue.quantity),
      triggerPrice: Number(formValue.triggerPrice),
      condition: formValue.condition!,
      stopEndUnixTime: formValue.stopEndUnixTime
        ? timezoneConverter.terminalToUtc0Date(formValue.stopEndUnixTime as Date)
        : undefined,
      side: side,
    };
  }

  private getStopLimitOrder(
    instrument: Instrument,
    side: Side,
    formValue: {
      quantity?: number;
      triggerPrice?: number | null;
      condition?: Condition | null;
      stopEndUnixTime?: Date | null;
      price?: number | null;
      icebergFixed?: number | null;
      icebergVariance?: number | null;
      timeInForce?: TimeInForce | null;
      isIceberg?: boolean;
    },
    timezoneConverter: TimezoneConverter
  ): NewStopLimitOrder {
    const order = {
      ...this.getStopMarketOrder(instrument, side, formValue, timezoneConverter),
      price: Number(formValue.price)
    } as NewStopLimitOrder;

    if (formValue.timeInForce != null) {
      order.timeInForce = formValue.timeInForce;
    }

    if (formValue.icebergFixed ?? 0) {
      order.icebergFixed = Number(formValue.icebergFixed);
    }

    if (formValue.icebergVariance ?? 0) {
      order.icebergVariance = Number(formValue.icebergVariance);
    }

    return order;
  }

  private checkFieldsAvailability(): void {
    if (this.form.value.withLimit === true) {
      this.enableControl(this.form.controls.price);
      this.enableControl(this.form.controls.timeInForce);
      this.enableControl(this.form.controls.isIceberg);
    } else {
      this.disableControl(this.form.controls.price);
      this.disableControl(this.form.controls.timeInForce);
      this.disableControl(this.form.controls.isIceberg);
    }

    if (this.form.controls.isIceberg.enabled && this.form.controls.isIceberg.value) {
      this.enableControl(this.form.controls.icebergFixed);
      this.enableControl(this.form.controls.icebergVariance);
    } else {
      this.disableControl(this.form.controls.icebergFixed);
      this.disableControl(this.form.controls.icebergVariance);
    }

    if (this.form.controls.allowLinkedOrder.enabled && this.form.controls.allowLinkedOrder.value) {
      this.enableControl(this.form.controls.linkedOrder);

      if (this.form.controls.linkedOrder.controls.withLimit.value) {
        this.enableControl(this.form.controls.linkedOrder.controls.price);
      } else {
        this.disableControl(this.form.controls.linkedOrder.controls.price);
      }
    } else {
      this.disableControl(this.form.controls.linkedOrder);
    }

    this.form.updateValueAndValidity();
  }

  private initPriceDiffCalculation(): void {
    this.currentPriceDiffPercent$ = PriceDiffHelper.getPriceDiffCalculation(
      this.form.controls.price,
      this.getInstrumentWithPortfolio(),
      this.portfolioSubscriptionsService
    );
  }

  private initFormFieldsCheck(): void {
    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.checkFieldsAvailability());
  }

  private initFieldDependencies(): void {
    this.form.controls.triggerPrice.valueChanges.pipe(
      filter(() => !(this.initialValues()?.stopOrder?.disableCalculations ?? false)),
      distinctUntilChanged((prev, curr) => prev === curr),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => {
      this.form.controls.price.setValue(val);
    });

    this.form.controls.allowLinkedOrder.valueChanges.pipe(
      filter(v => v),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.form.controls.linkedOrder.controls.condition.markAsTouched();
      this.form.controls.linkedOrder.controls.side.markAsTouched();
    });

    combineLatest([
      this.activatedChanges$,
      this.form.controls.price.valueChanges
    ]).pipe(
      filter(() => !(this.initialValues()?.stopOrder?.disableCalculations ?? false)),
      filter(([isActivated, v]) => isActivated && this.form.controls.condition.untouched && !!(v ?? 0)),
      map(([, price]) => price),
      distinctUntilChanged((prev, curr) => prev === curr),
      debounceTime(500),
      mapWith(
        () => this.getCurrentPrice(),
        (value, lastPrice) => ({value, lastPrice})
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => {
      this.form.controls.condition.setValue(((v.lastPrice ?? 0) < +(v.value ?? 0)) ? Condition.More : Condition.Less);
    });
  }

  private getCurrentPrice(): Observable<number | null> {
    return this.getInstrumentWithPortfolio()
      .pipe(
        take(1),
        switchMap(x => this.quotesService.getLastPrice(x.instrument))
      );
  }

  private checkNowTimeSelection(timezoneConverter: TimezoneConverter): void {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    const now = new Date();
    const convertedNow = timezoneConverter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }
}
