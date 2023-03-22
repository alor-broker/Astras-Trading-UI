import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  BehaviorSubject,
  filter,
  Subject,
  takeUntil,
  withLatestFrom
} from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import {
  addMonthsUnix,
  getUtcNow,
  startOfDay,
  toUnixTime
} from 'src/app/shared/utils/datetime';
import { StopFormData } from '../../models/stop-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { StopCommand } from '../../models/stop-command.model';
import { CommandContextModel } from '../../models/command-context.model';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../shared/models/form.model';
import { AtsValidators } from "../../../../shared/utils/form-validators";

@Component({
  selector: 'ats-stop-command',
  templateUrl: './stop-command.component.html',
  styleUrls: ['./stop-command.component.less']
})
export class StopCommandComponent implements OnInit, OnDestroy {
  form!: FormGroup<ControlsOf<StopFormData>>;
  commandContext$ = new BehaviorSubject<CommandContextModel<CommandParams> | null>(null);
  public canSelectNow = true;
  private timezoneConverter!: TimezoneConverter;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private service: CommandsService, private readonly timezoneConverterService: TimezoneConverterService) {
  }

  @Input()
  set commandContext(value: CommandContextModel<CommandParams>) {
    this.commandContext$.next(value);
  }

  ngOnInit() {
    this.commandContext$.pipe(
      filter((x): x is CommandContextModel<CommandParams> => !!x),
      withLatestFrom(this.timezoneConverterService.getConverter()),
      takeUntil(this.destroy$)
    ).subscribe(([context, converter]) => {
      this.initCommandForm(context, converter);
      this.checkNowTimeSelection(converter);
    });

    this.service.commandError$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(isErr => {
        if (isErr) {
          Object.values(this.form.controls).forEach(c => {
            c.markAsDirty();
            c.updateValueAndValidity({ onlySelf: false });
          });
        }
      });

    this.service.priceSelected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(price => {
      this.form.get('price')?.setValue(price);
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

  private checkNowTimeSelection(converter: TimezoneConverter) {
    // nz-date-picker does not support timezones changing
    // now selection will be available only if time displayed in current timezone
    const now = new Date();
    const convertedNow = converter.toTerminalDate(now);
    this.canSelectNow = convertedNow.toUTCString() === now.toUTCString();
  }

  private setStopCommand(initialParameters: CommandParams): void {
    if (!this.form.valid) {
      this.service.setStopCommand(null);
      return;
    }

    const formValue = this.form.value;

    let additionalData = {} as any;

    if (formValue.isIceberg) {
      additionalData.icebergFixed = Number(formValue.icebergFixed ?? 0);
      if (formValue.icebergVariance) {
        additionalData.icebergVariance = Number(formValue.icebergVariance);
      }
    }

    if (formValue.timeInForce) {
      additionalData.timeInForce = formValue.timeInForce;
    }

    if (initialParameters && initialParameters.user) {
      const price = Number(formValue.price);
      const newCommand: StopCommand = {
        quantity: Number(formValue.quantity),
        triggerPrice: Number(formValue.triggerPrice),
        condition: formValue.condition!,
        stopEndUnixTime: !!formValue.stopEndUnixTime
          ? this.timezoneConverter.terminalToUtc0Date(formValue.stopEndUnixTime)
          : undefined,
        price: formValue.withLimit ? price : undefined,
        instrument: {
          ...initialParameters.instrument
        },
        user: initialParameters.user,
        ...additionalData
      };

      this.service.setStopCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private buildForm(commandContext: CommandContextModel<CommandParams>): FormGroup<ControlsOf<StopFormData>> {
    let price = commandContext.commandParameters.price;
    if (price == 1 || price == null) {
      price = 0;
    }

    return new FormGroup<ControlsOf<StopFormData>>({
      quantity: new FormControl(
        commandContext.commandParameters.quantity ?? 1,
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
          AtsValidators.priceStepMultiplicity(commandContext.instrument.minstep || 0)
        ]
      ),
      triggerPrice: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max),
          AtsValidators.priceStepMultiplicity(commandContext.instrument.minstep || 0)
        ]
      ),
      stopEndUnixTime: new FormControl(!!commandContext.commandParameters.stopEndUnixTime
        ? new Date(commandContext.commandParameters.stopEndUnixTime)
        : this.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1))
      ),
      condition: new FormControl(StopOrderCondition.More),
      withLimit: new FormControl(false),
      timeInForce: new FormControl(null),
      isIceberg: new FormControl(false),
      icebergFixed: new FormControl(null),
      icebergVariance: new FormControl(null),
    });
  }

  private initCommandForm(commandContext: CommandContextModel<CommandParams>, converter: TimezoneConverter) {
    if (!commandContext.commandParameters) {
      return;
    }

    this.timezoneConverter = converter;
    this.form = this.buildForm(commandContext);
    this.setStopCommand(commandContext.commandParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) =>
        prev?.condition == curr?.condition
        && prev?.price == curr?.price
        && prev?.quantity == curr?.quantity
        && prev?.triggerPrice == curr?.triggerPrice
        && prev?.stopEndUnixTime == curr?.stopEndUnixTime
        && prev?.timeInForce == curr?.timeInForce
        && prev?.isIceberg == curr?.isIceberg
        && prev?.icebergFixed == curr?.icebergFixed
        && prev?.icebergVariance == curr?.icebergVariance
      ),
    ).subscribe(() => {
      this.setStopCommand(commandContext.commandParameters);
    });
  }
}
