import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  filter,
  Subject,
  takeUntil,
  withLatestFrom
} from "rxjs";
import { CommandContextModel } from "../../models/command-context.model";
import { EditParams } from "../../../../shared/models/commands/edit-params.model";
import { CommandsService } from "../../services/commands.service";
import { distinctUntilChanged } from "rxjs/operators";
import {
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { StopFormData } from "../../models/stop-form-data.model";
import {
  addMonthsUnix,
  getUtcNow,
  startOfDay,
  toUnixTime
} from "../../../../shared/utils/datetime";
import { StopOrderCondition } from "../../../../shared/models/enums/stoporder-conditions";
import { StopEdit } from "../../models/stop-edit";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../shared/models/form.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { AtsValidators } from "../../../../shared/utils/form-validators";
import { TimeInForce } from "../../../../shared/models/commands/command-params.model";

@Component({
  selector: 'ats-stop-edit',
  templateUrl: './stop-edit.component.html',
  styleUrls: ['./stop-edit.component.less']
})
export class StopEditComponent implements OnInit, OnDestroy {
  form!: FormGroup<ControlsOf<StopFormData & { side: Side }>>;
  commandContext$ = new BehaviorSubject<CommandContextModel<EditParams> | null>(null);
  canSelectNow = false;
  timeInForceEnum = TimeInForce;
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
      this.initCommandForm(context, converter);
      this.checkNowTimeSelection(converter);
    });

    this.service.quantitySelected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(qty => {
      this.form.get('quantity')?.setValue(qty);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.commandContext$.complete();
  }

  disabledDate = (date: Date) => {
    const today = startOfDay(new Date());
    return toUnixTime(date) < toUnixTime(today);
  };

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

  private initCommandForm(commandContext:  CommandContextModel<EditParams>, converter: TimezoneConverter) {
    if (!commandContext.commandParameters) {
      return;
    }

    this.timezoneConverter = converter;
    this.form = this.buildForm(commandContext);
    this.setStopEdit(commandContext.commandParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) =>
        JSON.stringify(prev) === JSON.stringify(curr)
      ),
    ).subscribe((val) => {
      let additionalData = {} as any;

      if (val.isIceberg) {
        additionalData.icebergFixed = Number(val.icebergFixed ?? 0);
        if (val.icebergVariance) {
          additionalData.icebergVariance = Number(val.icebergVariance);
        }
      }

      if (val.timeInForce) {
        additionalData.timeInForce = val.timeInForce;
      }

      this.setStopEdit({
        ...commandContext.commandParameters,
        ...val,
        price: Number(val.price),
        quantity: val.quantity!,
        side: val.side!,
        ...additionalData
      });
    });
  }

  private buildForm(initialParameters: CommandContextModel<EditParams>): FormGroup<ControlsOf<StopFormData & { side: Side }>> {
    let price = initialParameters.commandParameters.price;
    if (price == 1 || price == null) {
      price = 0;
    }

    return new FormGroup<ControlsOf<StopFormData & { side: Side }>>({
      quantity: new FormControl(
        initialParameters.commandParameters.quantity ?? 1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      price: new FormControl(
        price,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max),
          AtsValidators.priceStepMultiplicity(initialParameters.instrument.minstep || 0)
        ]
      ),
      triggerPrice: new FormControl(
        initialParameters.commandParameters.triggerPrice!,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max),
          AtsValidators.priceStepMultiplicity(initialParameters.instrument.minstep || 0)
        ]
      ),
      stopEndUnixTime: new FormControl(!!initialParameters.commandParameters.stopEndUnixTime
        ? new Date(initialParameters.commandParameters.stopEndUnixTime)
        : this.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1))
      ),
      condition: new FormControl(initialParameters.commandParameters.condition || StopOrderCondition.More),
      withLimit: new FormControl({ value: initialParameters.commandParameters.type === 'stoplimit', disabled: true }),
      side: new FormControl(initialParameters.commandParameters.side),
      timeInForce: new FormControl(initialParameters.commandParameters.timeInForce),
      isIceberg: new FormControl(!!initialParameters.commandParameters.icebergFixed || initialParameters.commandParameters.icebergFixed === 0),
      icebergFixed: new FormControl(initialParameters.commandParameters.icebergFixed),
      icebergVariance: new FormControl(initialParameters.commandParameters.icebergVariance),
    });
  }

  private checkNowTimeSelection(converter: TimezoneConverter) {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    const now = new Date();
    const convertedNow = converter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }
}

