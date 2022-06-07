import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, Subject, takeUntil, withLatestFrom } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import { addMonthsUnix, getUtcNow } from 'src/app/shared/utils/datetime';
import { StopFormControls, StopFormGroup } from '../../models/command-forms.model';
import { StopFormData } from '../../models/stop-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { StopCommand } from '../../models/stop-command.model';
import { CommandContextModel } from '../../models/command-context.model';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';

@Component({
  selector: 'ats-stop-command',
  templateUrl: './stop-command.component.html',
  styleUrls: ['./stop-command.component.less']
})
export class StopCommandComponent implements OnInit, OnDestroy {
  form!: StopFormGroup;
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
      this.initCommandForm(context.commandParameters, converter);
      this.checkNowTimeSelection(converter);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.commandContext$.complete();
  }

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

    const formValue = this.form.value as StopFormData;

    if (initialParameters && initialParameters.user) {
      const price = Number(formValue.price);
      const newCommand: StopCommand = {
        side: 'buy',
        quantity: Number(formValue.quantity),
        triggerPrice: Number(formValue.triggerPrice),
        condition: formValue.condition,
        stopEndUnixTime: !!formValue.stopEndUnixTime
          ? this.timezoneConverter.terminalToUtc0Date(formValue.stopEndUnixTime)
          : undefined,
        price: formValue.withLimit ? price : null,
        instrument: {
          ...initialParameters.instrument
        },
        user: initialParameters.user,
      };

      this.service.setStopCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private buildForm(initialParameters: CommandParams) {
    let price = initialParameters.price;
    if (price == 1 || price == null) {
      price = 0;
    }

    return new FormGroup({
      quantity: new FormControl(
        initialParameters.quantity ?? 1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]
      ),
      price: new FormControl(
        price,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]
      ),
      triggerPrice: new FormControl(
        0,
        [
          Validators.required,
          Validators.min(0),
        ]
      ),
      stopEndUnixTime: new FormControl(initialParameters.stopEndUnixTime ?? this.timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1))),
      condition: new FormControl(StopOrderCondition.More),
      withLimit: new FormControl(false)
    } as StopFormControls) as StopFormGroup;
  }

  private initCommandForm(initialParameters: CommandParams | null, converter: TimezoneConverter) {
    if (!initialParameters) {
      return;
    }

    this.timezoneConverter = converter;
    this.form = this.buildForm(initialParameters);
    this.setStopCommand(initialParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged<StopFormData>((prev, curr) =>
        prev?.condition == curr?.condition &&
        prev?.price == curr?.price &&
        prev?.quantity == curr?.quantity &&
        prev?.triggerPrice == curr?.triggerPrice &&
        prev?.stopEndUnixTime == curr?.stopEndUnixTime),
    ).subscribe(() => {
      this.setStopCommand(initialParameters);
    });
  }
}
