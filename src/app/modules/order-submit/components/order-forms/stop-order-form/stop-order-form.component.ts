import { Component } from '@angular/core';
import {
  StopLimitOrder,
  StopMarketOrder
} from "../../../../command/models/order.model";
import { OrderFormBaseComponent } from "../order-form-base.component";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import {
  addMonthsUnix,
  getUtcNow, startOfDay, toUnixTime
} from "../../../../../shared/utils/datetime";
import { StopOrderCondition } from "../../../../../shared/models/enums/stoporder-conditions";
import {
  StopFormControls,
  StopFormGroup
} from "../../../../command/models/command-forms.model";
import { Observable } from "rxjs";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import { map } from "rxjs/operators";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";

export type StopOrderFormValue =
  Omit<StopMarketOrder, 'instrument' | 'side'>
  & Omit<StopLimitOrder, 'instrument' | 'side'>
  & { withLimit: boolean };

@Component({
  selector: 'ats-stop-order-form',
  templateUrl: './stop-order-form.component.html',
  styleUrls: ['./stop-order-form.component.less']
})
export class StopOrderFormComponent extends OrderFormBaseComponent<StopOrderFormValue, { timezoneConverter: TimezoneConverter }> {
  public canSelectNow = true;
  private timezoneConverter!: TimezoneConverter;

  constructor(
    private readonly timezoneConverterService: TimezoneConverterService,
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
  }

  protected buildForm(instrument: Instrument, additions: { timezoneConverter: TimezoneConverter } | null): UntypedFormGroup {
    this.timezoneConverter = additions!.timezoneConverter;
    this.checkNowTimeSelection();

    return new UntypedFormGroup({
      quantity: new UntypedFormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      price: new UntypedFormControl(
        null,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      triggerPrice: new UntypedFormControl(
        null,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max),
        ]
      ),
      stopEndUnixTime: new UntypedFormControl(additions!.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1))),
      condition: new UntypedFormControl(StopOrderCondition.More),
      withLimit: new UntypedFormControl(false)
    } as StopFormControls) as StopFormGroup;
  }

  protected getFormInitAdditions(): Observable<{ timezoneConverter: TimezoneConverter } | null> {
    return this.timezoneConverterService.getConverter().pipe(
      map(converter => ({ timezoneConverter: converter }))
    );
  }

  protected getFormValue(): StopOrderFormValue | null {
    const formValue = super.getFormValue();
    if (!formValue) {
      return formValue;
    }

    return {
      ...formValue,
      quantity: Number(formValue.quantity),
      triggerPrice: Number(formValue.triggerPrice),
      price: !!formValue.price ? Number(formValue.price) : formValue.price,
      stopEndUnixTime: !!formValue.stopEndUnixTime
        ? this.timezoneConverter.terminalToUtc0Date(formValue.stopEndUnixTime as Date)
        : undefined,
    };
  }

  protected applyInitialValues(values: Partial<StopOrderFormValue> | null) {
    if (!!values?.price && this.form?.get('withLimit')?.value) {
      this.form!.get('price')?.setValue(values.price);
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
}
