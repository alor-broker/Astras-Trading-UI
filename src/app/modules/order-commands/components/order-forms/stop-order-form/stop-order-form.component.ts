import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { BaseOrderFormComponent } from "../base-order-form.component";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { CommonParametersService } from "../../../services/common-parameters.service";
import { PortfolioSubscriptionsService } from "../../../../../shared/services/portfolio-subscriptions.service";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import { LessMore } from "../../../../../shared/models/enums/less-more.model";
import {
  OrderType,
  TimeInForce
} from "../../../../../shared/models/orders/order.model";
import { Side } from "../../../../../shared/models/enums/side.model";
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  switchMap,
  take
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  debounceTime,
  filter,
  map
} from "rxjs/operators";
import { PriceDiffHelper } from "../../../utils/price-diff.helper";
import { QuotesService } from "../../../../../shared/services/quotes.service";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import {
  addMonthsUnix,
  getUtcNow,
  startOfDay,
  toUnixTime
} from "../../../../../shared/utils/datetime";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";
import {
  NewLinkedOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../../../shared/utils/instruments";
import {
  ExecutionPolicy,
  SubmitGroupResult
} from "../../../../../shared/models/orders/orders-group.model";
import {ConfirmableOrderCommandsService} from "../../../services/confirmable-order-commands.service";

@Component({
    selector: 'ats-stop-order-form',
    templateUrl: './stop-order-form.component.html',
    styleUrls: ['./stop-order-form.component.less'],
    standalone: false
})
export class StopOrderFormComponent extends BaseOrderFormComponent implements OnInit, OnDestroy {
  readonly sides = Side;
  canSelectNow = true;
  readonly conditionType = LessMore;
  readonly timeInForceEnum = TimeInForce;

  @Input()
  initialValues: {
    price?: number;
    quantity?: number;
    stopOrder?: Partial<{
      triggerPrice: number | null;
      condition: LessMore | null;
      limit: boolean | null;
      // Set to true to prevent parameters recalculation.
      // For example, trigger price, condition and limit order price should not be recalculated when form is called from scalper orderbook
      disableCalculations: boolean | null;
    }>;
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
    triggerPrice: this.formBuilder.control<number | null>(null),
    condition: this.formBuilder.nonNullable.control(LessMore.More),
    stopEndUnixTime: this.formBuilder.control<Date | null>(null),
    withLimit: this.formBuilder.nonNullable.control(false),
    price: this.formBuilder.control<number | null>(null),
    timeInForce: this.formBuilder.control<TimeInForce | null>(null),

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

    allowLinkedOrder: this.formBuilder.nonNullable.control(false),
    linkedOrder: this.formBuilder.group({
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
      triggerPrice: this.formBuilder.control<number | null>(null),
      condition: this.formBuilder.nonNullable.control(LessMore.More),
      stopEndUnixTime: this.formBuilder.control<Date | null>(null),
      withLimit: this.formBuilder.nonNullable.control(false),
      price: this.formBuilder.control<number | null>(null),
      side: this.formBuilder.nonNullable.control(Side.Buy),
    })
  });

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  constructor(
    private readonly formBuilder: FormBuilder,
    protected readonly commonParametersService: CommonParametersService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly orderCommandService: ConfirmableOrderCommandsService,
    private readonly quotesService: QuotesService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly destroyRef: DestroyRef) {
    super(commonParametersService, destroyRef);
  }

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
    return toUnixTime(date) < toUnixTime(today);
  };

  protected changeInstrument(newInstrument: Instrument): void {
    this.form.reset(undefined, {emitEvent: true});

    this.setPriceValidators(this.form.controls.triggerPrice, newInstrument);
    this.setPriceValidators(this.form.controls.price, newInstrument);

    this.setPriceValidators(this.form.controls.linkedOrder.controls.triggerPrice, newInstrument);
    this.setPriceValidators(this.form.controls.linkedOrder.controls.price, newInstrument);

    if (this.initialValues) {
      if (this.initialValues.quantity != null) {
        this.form.controls.quantity.setValue(this.initialValues.quantity);
      }

      if (this.initialValues.price != null) {
        this.form.controls.triggerPrice.setValue(this.initialValues.price);
        this.form.controls.price.setValue(this.initialValues.price);
      }

      if (this.initialValues.stopOrder) {
        if (this.initialValues.stopOrder.triggerPrice != null) {
          this.form.controls.triggerPrice.setValue(this.initialValues.stopOrder.triggerPrice);
        }

        if (this.initialValues.stopOrder.limit != null) {
          this.form.controls.withLimit.setValue(this.initialValues.stopOrder.limit);
        }

        if (this.initialValues.stopOrder.condition != null) {
          this.form.controls.condition.setValue(this.initialValues.stopOrder.condition);
        }
      }
    }

    this.form.clearValidators();
    this.form.addValidators([
      AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
    ]);

    this.timezoneConverterService.getConverter().pipe(
      take(1)
    ).subscribe(tc => {
      const stopTime = tc.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1));

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
      condition?: LessMore;
      stopEndUnixTime?: Date | null;
    },
    timezoneConverter: TimezoneConverter
  ): NewStopMarketOrder {
    return {
      instrument: toInstrumentKey(instrument),
      quantity: Number(formValue.quantity),
      triggerPrice: Number(formValue.triggerPrice),
      condition: formValue.condition!,
      stopEndUnixTime: !!formValue.stopEndUnixTime
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
      condition?: LessMore;
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
      filter(() => !(this.initialValues?.stopOrder?.disableCalculations ?? false)),
      distinctUntilChanged((prev, curr) => prev === curr),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => {
      this.form.controls.price.setValue(val);
    });

    combineLatest([
      this.isActivated$,
      this.form.controls.price.valueChanges
    ]).pipe(
      filter(() => !(this.initialValues?.stopOrder?.disableCalculations ?? false)),
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
      this.form.controls.condition.setValue(((v.lastPrice ?? 0) < +(v.value ?? 0)) ? LessMore.More : LessMore.Less);
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
