import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {CommonParametersService} from "../../../services/common-parameters.service";
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
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
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
import {BaseEditOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/base-edit-order-form';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {OrderDetailsService} from '@terminal-core-lib/features/orders/services/order-details.service';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {StopOrder} from '@terminal-core-lib/features/portfolios/types/order.types';
import {
  OrderType,
  TimeInForce
} from '@terminal-core-lib/features/orders/types/orders.types';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {
  getUnixTime,
  startOfDay
} from 'date-fns';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {ConditionHelper} from '@terminal-core-lib/common/utils/condition.helper';
import {notBiggerThan} from '@terminal-core-lib/features/forms/validators/not-bigger-than';
import {PriceDiffHelper} from '@terminal-widgets-lib/widgets/order-commands/utils/price-diff.helper';
import {TimezoneConverter} from '@terminal-core-lib/features/timezones/utils/timezone-converter';
import {
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from '@terminal-core-lib/features/orders/types/edit-order.types';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';

@Component({
  selector: 'ats-edit-stop-order-form',
  templateUrl: './edit-stop-order-form.html',
  styleUrls: ['./edit-stop-order-form.less'],
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
    ShortNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EditStopOrderForm extends BaseEditOrderForm implements OnInit {
  currentOrder$!: Observable<StopOrder>;

  canSelectNow = true;

  readonly conditionType = Condition;

  readonly timeInForceEnum = TimeInForce;

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  readonly initialValues = input<{
    triggerPrice?: number;
    price?: number;
    quantity?: number;
    hasPriceChanged?: boolean;
  } | null>(null);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
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
    )
  });

  private readonly orderDetailsService = inject(OrderDetailsService);

  private readonly commonParametersService = inject(CommonParametersService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

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
    return getUnixTime(date) < getUnixTime(today);
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
      this.form.controls.condition.setValue(ConditionHelper.getConditionTypeByString(x.currentOrder.conditionType) ?? Condition.More);
      this.form.controls.price.setValue(initialValues?.price ?? x.currentOrder.price);

      this.form.controls.withLimit.setValue(x.currentOrder.type === OrderType.StopLimit);

      this.form.controls.timeInForce.setValue(x.currentOrder.timeInForce ?? null);

      if (x.currentOrder.iceberg) {
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
        notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
      ]);

      this.timezoneConverterService.getConverter().pipe(
        take(1)
      ).subscribe(tc => {
        // API sets max date if user omits stopEndUnixTime value on create/edit form. See https://github.com/alor-broker/Astras-Trading-UI/issues/1662
        if (x.currentOrder.endTime != null && x.currentOrder.endTime.getUTCFullYear() !== 9999) {
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
          stopEndUnixTime: formValue.stopEndUnixTime
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
