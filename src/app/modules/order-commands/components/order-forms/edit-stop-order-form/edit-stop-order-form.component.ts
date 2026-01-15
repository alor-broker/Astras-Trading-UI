import { Component, DestroyRef, OnInit, input, inject } from '@angular/core';
import { BaseEditOrderFormComponent } from "../base-edit-order-form.component";
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { OrderDetailsService } from "../../../../../shared/services/orders/order-details.service";
import { InstrumentsService } from "../../../../instruments/services/instruments.service";
import { CommonParametersService } from "../../../services/common-parameters.service";
import { PortfolioSubscriptionsService } from "../../../../../shared/services/portfolio-subscriptions.service";
import { LessMore } from "../../../../../shared/models/enums/less-more.model";
import {
  OrderType,
  StopOrder,
  TimeInForce
} from "../../../../../shared/models/orders/order.model";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  filter,
  map,
  switchMap
} from "rxjs/operators";
import {
  startOfDay,
  toUnixTime
} from "../../../../../shared/utils/datetime";
import { PriceDiffHelper } from "../../../utils/price-diff.helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import {
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../../../../shared/models/orders/edit-order.model";
import { getConditionTypeByString } from "../../../../../shared/utils/order-conditions-helper";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import {ConfirmableOrderCommandsService} from "../../../services/confirmable-order-commands.service";
import { TranslocoDirective } from '@jsverse/transloco';
import { NzFormDirective, NzFormItemComponent, NzFormLabelComponent, NzFormControlComponent } from 'ng-zorro-antd/form';
import { NzRowDirective, NzColDirective } from 'ng-zorro-antd/grid';
import { InputNumberComponent } from '../../../../../shared/components/input-number/input-number.component';
import { ShortNumberComponent } from '../../../../../shared/components/short-number/short-number.component';
import { NzSelectComponent, NzOptionComponent } from 'ng-zorro-antd/select';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { NzRadioGroupComponent, NzRadioComponent } from 'ng-zorro-antd/radio';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NzCollapseComponent, NzCollapsePanelComponent } from 'ng-zorro-antd/collapse';
import { NzCheckboxComponent } from 'ng-zorro-antd/checkbox';
import { NzTypographyComponent } from 'ng-zorro-antd/typography';
import { AsyncPipe, DecimalPipe, KeyValuePipe } from '@angular/common';

@Component({
    selector: 'ats-edit-stop-order-form',
    templateUrl: './edit-stop-order-form.component.html',
    styleUrls: ['./edit-stop-order-form.component.less'],
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
      InputNumberComponent,
      ShortNumberComponent,
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
      KeyValuePipe
    ]
})
export class EditStopOrderFormComponent extends BaseEditOrderFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly orderDetailsService = inject(OrderDetailsService);
  protected readonly instrumentService: InstrumentsService;
  private readonly commonParametersService = inject(CommonParametersService);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);
  private readonly timezoneConverterService = inject(TimezoneConverterService);
  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);
  protected readonly destroyRef: DestroyRef;

  currentOrder$!: Observable<StopOrder>;
  canSelectNow = true;
  readonly conditionType = LessMore;
  readonly timeInForceEnum = TimeInForce;

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  readonly initialValues = input<{
    triggerPrice?: number;
    price?: number;
    quantity?: number;
    hasPriceChanged?: boolean;
} | null>(null);

  readonly form = this.formBuilder.group({
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

  constructor() {
    const instrumentService = inject(InstrumentsService);
    const destroyRef = inject(DestroyRef);

    super(instrumentService, destroyRef);

    this.instrumentService = instrumentService;
    this.destroyRef = destroyRef;
  }

  ngOnInit(): void {
    this.currentOrder$ = combineLatest({
      orderId: this.orderIdChanges$,
      portfolioKey: this.portfolioKeyChanges$
    }).pipe(
      filter(x => x.orderId != null && !!x.orderId.length && !!x.portfolioKey),
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

  disabledDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    return toUnixTime(date) < toUnixTime(today);
  };

  private initOrderChange(): void {
    combineLatest({
      currentOrder: this.currentOrder$,
      currentInstrument: this.formInstrument$
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((x: { currentOrder: StopOrder, currentInstrument: Instrument }) => {
      this.form.reset(undefined, {emitEvent: true});

      this.setPriceValidators(this.form.controls.triggerPrice, x.currentInstrument);
      this.setPriceValidators(this.form.controls.price, x.currentInstrument);

      const initialValues = this.initialValues();
      this.form.controls.quantity.setValue(initialValues?.quantity ?? x.currentOrder.qtyBatch);
      this.form.controls.triggerPrice.setValue(initialValues?.triggerPrice ?? initialValues?.price ?? x.currentOrder.triggerPrice);
      this.form.controls.condition.setValue(getConditionTypeByString(x.currentOrder.conditionType) ?? LessMore.More);
      this.form.controls.price.setValue(initialValues?.price ?? x.currentOrder.price);

      this.form.controls.withLimit.setValue(x.currentOrder.type === OrderType.StopLimit);

      this.form.controls.timeInForce.setValue(x.currentOrder.timeInForce ?? null);

      if (!!x.currentOrder.iceberg) {
        this.form.controls.isIceberg.setValue(true);
        if (x.currentOrder.iceberg.creationFixedQuantity ?? 0) {
          this.form.controls.icebergFixed.setValue(x.currentOrder.iceberg.creationFixedQuantity!);
        }

        if (x.currentOrder.iceberg.creationVarianceQuantity ?? 0) {
          this.form.controls.icebergVariance.setValue(x.currentOrder.iceberg.creationVarianceQuantity!);
        }
      }

      this.form.clearValidators();
      this.form.addValidators([
        AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
      ]);

      this.timezoneConverterService.getConverter().pipe(
        take(1)
      ).subscribe(tc => {
        // API sets max date if user omits stopEndUnixTime value on create/edit form. See https://github.com/alor-broker/Astras-Trading-UI/issues/1662
        if(x.currentOrder.endTime != null && x.currentOrder.endTime.getUTCFullYear() !== 9999) {
          this.form.controls.stopEndUnixTime.setValue(tc.toTerminalDate(x.currentOrder.endTime));
        }

        this.checkNowTimeSelection(tc);
      });

      this.checkFieldsAvailability();
    });
  }

  private initCommonParametersUpdate(): void {
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

    this.form.updateValueAndValidity();
  }

  private checkNowTimeSelection(timezoneConverter: TimezoneConverter): void {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    const now = new Date();
    const convertedNow = timezoneConverter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }

  private initFormStateChangeNotification(): void {
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
      portfolioKey: this.portfolioKeyChanges$,
      tc: this.timezoneConverterService.getConverter()
    }).pipe(
      filter(x => !!x.portfolioKey),
      filter(() => this.form.valid),
      take(1),
      switchMap(x => {
        const formValue = this.form.value;

        const updatedOrder = {
          orderId: x.currentOrder.id,
          instrument: x.currentOrder.targetInstrument,
          quantity: Number(formValue.quantity),
          triggerPrice: Number(formValue.triggerPrice),
          condition: formValue.condition,
          stopEndUnixTime: !!formValue.stopEndUnixTime
            ? x.tc.terminalToUtc0Date(formValue.stopEndUnixTime as Date)
            : undefined,
          side: x.currentOrder.side
        } as StopMarketOrderEdit;

        if (formValue.withLimit ?? false) {
          const updatedLimitOrder = {
            ...updatedOrder,
            price: Number(formValue.price)
          } as StopLimitOrderEdit;

          if (formValue.timeInForce != null) {
            updatedLimitOrder.timeInForce = formValue.timeInForce;
          }

          if (formValue.icebergFixed ?? 0) {
            updatedLimitOrder.icebergFixed = Number(formValue.icebergFixed);
          }

          if (formValue.icebergVariance ?? 0) {
            updatedLimitOrder.icebergVariance = Number(formValue.icebergVariance);
          }

          return this.orderCommandService.submitStopLimitOrderEdit(updatedLimitOrder, x.portfolioKey!);
        }

        return this.orderCommandService.submitStopMarketOrderEdit(updatedOrder, x.portfolioKey!);
      }),
      map(r => r.isSuccess),
      take(1)
    );
  }
}
