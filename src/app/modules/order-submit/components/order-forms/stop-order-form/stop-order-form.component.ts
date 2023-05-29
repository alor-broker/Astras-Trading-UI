import { Component } from '@angular/core';
import {
  StopLimitOrder,
  StopMarketOrder
} from "../../../../command/models/order.model";
import { OrderFormBaseComponent } from "../order-form-base.component";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import {
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import {
  addMonthsUnix,
  getUtcNow,
  startOfDay,
  toUnixTime
} from "../../../../../shared/utils/datetime";
import { Observable, switchMap, take, takeUntil } from "rxjs";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import { map } from "rxjs/operators";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../../shared/models/form.model';
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import {
  OrderFormUpdate,
  OrderType
} from '../../../models/order-form.model';
import { QuotesService } from "../../../../../shared/services/quotes.service";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { TimeInForce } from "../../../../../shared/models/commands/command-params.model";
import {LessMore} from "../../../../../shared/models/enums/less-more.model";
import { LinkedOrderFormData } from "../../../../command/models/stop-form-data.model";
import { Side } from "../../../../../shared/models/enums/side.model";

export type StopOrderFormValue =
  Omit<StopMarketOrder, 'instrument' | 'side'> &
  Omit<StopLimitOrder, 'instrument' | 'side'> &
  {
    withLimit: boolean;
    isIceberg?: boolean;
    timeInForce?: TimeInForce;
    icebergFixed?: number;
    icebergVariance?: number;
  };

@Component({
  selector: 'ats-stop-order-form',
  templateUrl: './stop-order-form.component.html',
  styleUrls: ['./stop-order-form.component.less']
})
export class StopOrderFormComponent extends OrderFormBaseComponent<StopOrderFormValue, { timezoneConverter: TimezoneConverter }> {
  public canSelectNow = true;
  public conditionType = LessMore;
  public timeInForceEnum = TimeInForce;
  private timezoneConverter!: TimezoneConverter;

  constructor(
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly quotesService: QuotesService
  ) {
    super();
  }

  checkPriceAvailability() {
    if (!this.form) {
      return;
    }

    const priceControl = this.form.controls.price;
    if (this.form.controls.withLimit.value === true) {
      priceControl.enable();
    }
    else {
      priceControl.disable();
    }
  }

  disabledDate = (date: Date) => {
    const today = startOfDay(new Date());
    return toUnixTime(date) < toUnixTime(today);
  };

  protected onFormCreated() {
    this.checkPriceAvailability();
    this.initFormSubscriptions();
  }

  protected buildForm(instrument: Instrument, additions: { timezoneConverter: TimezoneConverter } | null): FormGroup<ControlsOf<StopOrderFormValue>> {
    this.timezoneConverter = additions!.timezoneConverter;
    this.checkNowTimeSelection();

    return new FormGroup<ControlsOf<StopOrderFormValue>>({
      quantity: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      price: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max),
          AtsValidators.priceStepMultiplicity(instrument.minstep)
        ]
      ),
      triggerPrice: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max),
          AtsValidators.priceStepMultiplicity(instrument.minstep)
        ]
      ),
      stopEndUnixTime: new FormControl(additions!.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1))),
      condition: new FormControl(this.conditionType.More),
      withLimit: new FormControl(false),
      timeInForce: new FormControl(null),
      isIceberg: new FormControl(false),
      icebergFixed: new FormControl(null, Validators.min(inputNumberValidation.min)),
      icebergVariance: new FormControl(null, Validators.min(inputNumberValidation.min)),
      allowLinkedOrder: new FormControl(false),
      linkedOrder: new FormGroup<ControlsOf<LinkedOrderFormData>>({
          quantity: new FormControl(
            1,
            [
              Validators.min(inputNumberValidation.min),
              Validators.max(inputNumberValidation.max)
            ]
          ),
          triggerPrice: new FormControl(
            1,
            [
              Validators.min(inputNumberValidation.negativeMin),
              Validators.max(inputNumberValidation.max),
              AtsValidators.priceStepMultiplicity(instrument.minstep || 0)
            ]
          ),
          price: new FormControl(
            1,
            [
              Validators.min(inputNumberValidation.negativeMin),
              Validators.max(inputNumberValidation.max),
              AtsValidators.priceStepMultiplicity(instrument.minstep || 0)
            ]
          ),
          stopEndUnixTime: new FormControl(this.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1))
          ),
          condition: new FormControl(LessMore.More),
          withLimit: new FormControl(false),
          side: new FormControl(Side.Buy)
        })
      },
      [
        AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => !!this.form?.get('isIceberg')?.value),
        AtsValidators.requiredIfTrue('allowLinkedOrder', 'linkedOrder.quantity'),
        AtsValidators.requiredIfTrue('allowLinkedOrder', 'linkedOrder.triggerPrice'),
        AtsValidators.requiredIfTrue('allowLinkedOrder', 'linkedOrder.price')
      ]
    );
  }

  protected getFormInitAdditions(): Observable<{ timezoneConverter: TimezoneConverter } | null> {
    return this.timezoneConverterService.getConverter().pipe(
      map(converter => ({ timezoneConverter: converter }))
    );
  }

  protected getFormValue(): StopOrderFormValue | null {
    if (!super.getFormValue()) {
      return null;
    }

    let formValue = { ...super.getFormValue()! };


    if (!formValue.isIceberg) {
      delete formValue.icebergFixed;
      delete formValue.icebergVariance;
    } else {
      formValue = {
        ...formValue,
        icebergFixed: Number(formValue.icebergFixed),
        icebergVariance: Number(formValue.icebergVariance)
      };
    }

    delete formValue.isIceberg;

    if (!formValue.timeInForce) {
      delete formValue.timeInForce;
    }

    return {
      ...formValue,
      quantity: Number(formValue.quantity),
      triggerPrice: Number(formValue.triggerPrice),
      price: (!!formValue.price ? Number(formValue.price) : formValue.price) as number,
      stopEndUnixTime: !!formValue.stopEndUnixTime
        ? this.timezoneConverter.terminalToUtc0Date(formValue.stopEndUnixTime as Date)
        : undefined,
    };
  }

  protected applyInitialValues(values: OrderFormUpdate<StopOrderFormValue>) {
    if(!!values?.target && values.target !== OrderType.StopOrder) {
      return;
    }

    if (!!values?.price && values.price !== Number(this.form?.get('price')?.value ?? 0)) {
      this.form!.get('price')?.setValue(values.price);
    }
    if (!!values?.quantity && values.quantity !== Number(this.form?.get('quantity')?.value ?? 0)) {
      this.form?.controls.quantity.setValue(values.quantity);
    }
    if (values?.withLimit) {
      this.form!.get('withLimit')?.setValue(values.withLimit);
    }
  }

  private checkNowTimeSelection() {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    if (!this.timezoneConverter) {
      return;
    }

    const now = new Date();
    const convertedNow = this.timezoneConverter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }

  private initFormSubscriptions() {
    this.form!.get('triggerPrice')!.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(val => {
        this.form!.get('price')!.setValue(val);
      });

    this.form!.get('price')!.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        mapWith(
          () => this.getCurrentPrice(),
          (value, lastPrice) => ({ value, lastPrice })
        )
      )
      .subscribe(({ value, lastPrice }) => {
        this.form!.get('condition')!.setValue( ((lastPrice ?? 0) < +(value ?? 0)) ? this.conditionType.More : this.conditionType.Less);
      });
  }

  private getCurrentPrice() {
    return this.instrument$
      .pipe(
        take(1),
        switchMap(i => this.quotesService.getLastPrice(i!))
      );
  }
}
