import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, Subject, takeUntil, withLatestFrom } from "rxjs";
import { StopFormControls, StopFormGroup } from "../../models/command-forms.model";
import { CommandContextModel } from "../../models/command-context.model";
import { EditParams } from "../../../../shared/models/commands/edit-params.model";
import { CommandsService } from "../../services/commands.service";
import { distinctUntilChanged } from "rxjs/operators";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { StopFormData } from "../../models/stop-form-data.model";
import { addMonthsUnix, getUtcNow, startOfDay, toUnixTime } from "../../../../shared/utils/datetime";
import { StopOrderCondition } from "../../../../shared/models/enums/stoporder-conditions";
import { StopEdit } from "../../models/stop-edit";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";

@Component({
  selector: 'ats-stop-edit',
  templateUrl: './stop-edit.component.html',
  styleUrls: ['./stop-edit.component.less']
})
export class StopEditComponent implements OnInit, OnDestroy {
  form!: StopFormGroup;
  commandContext$ = new BehaviorSubject<CommandContextModel<EditParams> | null>(null);
  canSelectNow = false;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private timezoneConverter!: TimezoneConverter;

  constructor(
    private service: CommandsService,
    private readonly timezoneConverterService: TimezoneConverterService
  ) {
  }

  @Input()
  set commandContext(value: CommandContextModel<EditParams>) {
    this.commandContext$.next(value);
  }

  ngOnInit() {
    this.commandContext$.pipe(
      filter((x): x is CommandContextModel<EditParams> => !!x),
      withLatestFrom(this.timezoneConverterService.getConverter()),
      takeUntil(this.destroy$)
    ).subscribe(([context, converter]) => {
      this.initCommandForm(context.commandParameters, converter);
      this.checkNowTimeSelection(converter);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.commandContext$.complete();
  }

  private setStopEdit(initialParameters: EditParams): void {
    if (!this.form.valid) {
      this.service.setStopEdit(null);
      return;
    }

    const formValue = this.form.getRawValue() as StopFormData;

    if (initialParameters && initialParameters.user) {
      const price = Number(formValue.price);
      const newCommand: StopEdit = {
        quantity: Number(formValue.quantity),
        triggerPrice: Number(formValue.triggerPrice),
        condition: formValue.condition,
        stopEndUnixTime: !!formValue.stopEndUnixTime
          ? this.timezoneConverter.terminalToUtc0Date(formValue.stopEndUnixTime).getTime() / 1000
          : undefined,
        price: formValue.withLimit ? price : undefined,
        instrument: {
          ...initialParameters.instrument
        },
        user: initialParameters.user,
        id: initialParameters.orderId,
        side: initialParameters.side
      };

      this.service.setStopEdit(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private initCommandForm(initialParameters: EditParams | null, converter: TimezoneConverter) {
    if (!initialParameters) {
      return;
    }

    this.timezoneConverter = converter;
    this.form = this.buildForm(initialParameters);
    this.setStopEdit(initialParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged<StopFormData>((prev, curr) =>
        prev?.condition == curr?.condition &&
        prev?.price == curr?.price &&
        prev?.quantity == curr?.quantity &&
        prev?.triggerPrice == curr?.triggerPrice &&
        prev?.stopEndUnixTime == curr?.stopEndUnixTime),
    ).subscribe((val) => {
      this.setStopEdit({
        ...initialParameters,
        ...val
      });
    });
  }

  private buildForm(initialParameters: EditParams) {
    let price = initialParameters.price;
    if (price == 1 || price == null) {
      price = 0;
    }

    return new UntypedFormGroup({
      quantity: new UntypedFormControl(
        initialParameters.quantity ?? 1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      price: new UntypedFormControl(
        price,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      triggerPrice: new UntypedFormControl(
        initialParameters.triggerPrice,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max),
        ]
      ),
      stopEndUnixTime: new UntypedFormControl(
        initialParameters.stopEndUnixTime ?? this.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1)),
        Validators.required
      ),
      condition: new UntypedFormControl(initialParameters.condition || StopOrderCondition.More),
      withLimit: new UntypedFormControl({ value: initialParameters.type === 'stoplimit', disabled: true }),
      side: new UntypedFormControl(initialParameters.side)
    } as StopFormControls) as StopFormGroup;
  }

  disabledDate = (date: Date) => {
    const today = startOfDay(new Date());
    return toUnixTime(date) < toUnixTime(today);
  };

  private checkNowTimeSelection(converter: TimezoneConverter) {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    const now = new Date();
    const convertedNow = converter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }
}

