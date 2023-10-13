import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import { BaseEditOrderFormComponent } from "../base-edit-order-form.component";
import { FormBuilder, Validators } from "@angular/forms";
import { OrderDetailsService } from "../../../../../shared/services/orders/order-details.service";
import { InstrumentsService } from "../../../../instruments/services/instruments.service";
import { CommonParametersService } from "../../../services/common-parameters.service";
import { PortfolioSubscriptionsService } from "../../../../../shared/services/portfolio-subscriptions.service";
import { OrderService } from "../../../../../shared/services/orders/order.service";
import { LessMore } from "../../../../../shared/models/enums/less-more.model";
import { StopOrder, TimeInForce } from "../../../../../shared/models/orders/order.model";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { combineLatest, distinctUntilChanged, Observable, shareReplay, take } from "rxjs";
import { filter, map, switchMap } from "rxjs/operators";
import { startOfDay, toUnixTime } from "../../../../../shared/utils/datetime";
import { PriceDiffHelper } from "../../../utils/price-diff.helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { QuotesService } from "../../../../../shared/services/quotes.service";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import { StopLimitOrderEdit, StopMarketOrderEdit } from "../../../../../shared/models/orders/edit-order.model";
import { getConditionTypeByString } from "../../../../../shared/utils/order-conditions-helper";

@Component({
  selector: 'ats-edit-stop-order-form',
  templateUrl: './edit-stop-order-form.component.html',
  styleUrls: ['./edit-stop-order-form.component.less']
})
export class EditStopOrderFormComponent extends BaseEditOrderFormComponent implements OnInit {
  currentOrder$!: Observable<StopOrder>;
  canSelectNow = true;
  readonly conditionType = LessMore;
  readonly timeInForceEnum = TimeInForce;

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  @Input()
  initialValues: {
    price?: number;
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
    )
  });


  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly orderDetailsService: OrderDetailsService,
    protected readonly instrumentService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly quotesService: QuotesService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly orderService: OrderService,
    protected readonly destroyRef: DestroyRef) {
    super(instrumentService, destroyRef);
  }

  ngOnInit(): void {
    this.currentOrder$ = combineLatest({
      orderId: this.orderId$,
      portfolioKey: this.portfolioKey$
    }).pipe(
      filter(x => !!x.orderId && !!x.portfolioKey),
      switchMap(x => this.orderDetailsService.getStopOrderDetails(x.orderId!, x.portfolioKey!)),
      filter((o): o is StopOrder => !!o),
      shareReplay(1)
    );

    this.initFormInstrument(this.currentOrder$);
    this.initOrderChange();
    this.initCommonParametersUpdate();
    this.initPriceDiffCalculation();
    this.initFormFieldsCheck();
    this.initFormStateChangeNotification();
  }

  disabledDate = (date: Date) => {
    const today = startOfDay(new Date());
    return toUnixTime(date) < toUnixTime(today);
  };

  private initOrderChange() {
    combineLatest({
      currentOrder: this.currentOrder$,
      currentInstrument: this.formInstrument$
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.form.reset(undefined, {emitEvent: true});

      this.setPriceValidators(this.form.controls.triggerPrice, x.currentInstrument);
      this.setPriceValidators(this.form.controls.price, x.currentInstrument);

      this.form.controls.quantity.setValue(this.initialValues?.quantity ?? x.currentOrder.qtyBatch);
      this.form.controls.triggerPrice.setValue(this.initialValues?.price ?? x.currentOrder.triggerPrice);
      this.form.controls.condition.setValue(getConditionTypeByString(x.currentOrder.conditionType) ?? LessMore.More);
      this.form.controls.price.setValue(this.initialValues?.price ?? x.currentOrder.price);

      this.form.controls.withLimit.setValue(x.currentOrder.type === 'stoplimit');

      this.form.controls.timeInForce.setValue(x.currentOrder.timeInForce ?? null);

      if (!!x.currentOrder.iceberg) {
        this.form.controls.isIceberg.setValue(true);
        if (x.currentOrder.iceberg.creationFixedQuantity) {
          this.form.controls.icebergFixed.setValue(x.currentOrder.iceberg.creationFixedQuantity);
        }

        if (x.currentOrder.iceberg.creationVarianceQuantity) {
          this.form.controls.icebergVariance.setValue(x.currentOrder.iceberg.creationVarianceQuantity);
        }
      }

      this.form.clearValidators();
      this.form.addValidators([
        AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
      ]);

      this.timezoneConverterService.getConverter().pipe(
        take(1)
      ).subscribe(tc => {
        if(x.currentOrder.endTime) {
          this.form.controls.stopEndUnixTime.setValue(tc.toTerminalDate(x.currentOrder.endTime));
        }

        this.checkNowTimeSelection(tc);
      });

      this.checkFieldsAvailability();
    });
  }

  private initCommonParametersUpdate() {
    this.commonParametersService.parameters$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(p => {
      if (p.quantity != null) {
        const newQuantity = p.quantity;
        if (this.form.controls.quantity.value !== newQuantity) {
          this.form.controls.quantity.setValue(newQuantity);
        }
      }

      if (p.price != null) {
        const newPrice = p.price;

        if (this.form.controls.triggerPrice.value !== newPrice) {
          this.form.controls.triggerPrice.setValue(newPrice);
        }
      }
    });

    this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity})),
      distinctUntilChanged((prev, curr) => prev.quantity === curr.quantity),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.commonParametersService.setParameters({
        quantity: x.quantity
      });
    });
  }

  private initPriceDiffCalculation() {
    this.currentPriceDiffPercent$ = PriceDiffHelper.getPriceDiffCalculation(
      this.form.controls.price,
      this.getInstrumentWithPortfolio(),
      this.portfolioSubscriptionsService
    );
  }

  private initFormFieldsCheck() {
    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.checkFieldsAvailability());
  }

  private checkFieldsAvailability() {
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

    this.form.updateValueAndValidity();
  }

  private getCurrentPrice() {
    return this.getInstrumentWithPortfolio()
      .pipe(
        take(1),
        switchMap(x => this.quotesService.getLastPrice(x.instrument))
      );
  }

  private checkNowTimeSelection(timezoneConverter: TimezoneConverter) {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    const now = new Date();
    const convertedNow = timezoneConverter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }

  private initFormStateChangeNotification() {
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.form.valid) {
        this.formStateChanged.emit({
          isValid: true,
          submit: () => this.prepareUpdateStream()
        });
      } else {
        this.formStateChanged.emit({
          isValid: false
        });
      }
    });
  }

  private prepareUpdateStream(): Observable<boolean> {
    return combineLatest({
      currentOrder: this.currentOrder$,
      portfolioKey: this.portfolioKey$,
      tc: this.timezoneConverterService.getConverter()
    }).pipe(
      filter(x => !!x.currentOrder && !!x.portfolioKey),
      filter(() => this.form.valid),
      switchMap(x => {
        const formValue = this.form.value;

        const updatedOrder = {
          id: x.currentOrder.id,
          instrument: {
            symbol: x.currentOrder.symbol,
            exchange: x.currentOrder.exchange
          },
          quantity: Number(formValue.quantity),
          triggerPrice: Number(formValue.triggerPrice),
          condition: formValue.condition,
          stopEndUnixTime: !!formValue.stopEndUnixTime
            ? x.tc.terminalToUtc0Date(formValue.stopEndUnixTime as Date)
            : undefined,
          side: x.currentOrder.side
        } as StopMarketOrderEdit;

        if (formValue.withLimit) {
          const limitOrder = {
            ...updatedOrder,
            price: Number(formValue.price)
          } as StopLimitOrderEdit;

          if (formValue.timeInForce) {
            limitOrder.timeInForce = formValue.timeInForce;
          }

          if (formValue.icebergFixed) {
            limitOrder.icebergFixed = Number(formValue.icebergFixed);
          }

          if (formValue.icebergVariance) {
            limitOrder.icebergVariance = Number(formValue.icebergVariance);
          }

          return this.orderService.submitStopLimitOrderEdit(limitOrder, x.portfolioKey!.portfolio);
        }

        return this.orderService.submitStopMarketOrderEdit(updatedOrder, x.portfolioKey!.portfolio);
      }),
      map(r => r.isSuccess),
      take(1)
    );
  }
}
