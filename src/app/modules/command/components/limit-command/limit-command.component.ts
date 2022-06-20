import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { CommandsService } from '../../services/commands.service';
import { LimitCommand } from '../../models/limit-command.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandContextModel } from '../../models/command-context.model';

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.less']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  evaluation$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  form!: LimitFormGroup;
  commandContext$ = new BehaviorSubject<CommandContextModel<CommandParams> | null>(null);
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private service: CommandsService) {
  }

  @Input()
  set commandContext(value: CommandContextModel<CommandParams>) {
    this.commandContext$.next(value);
  }

  ngOnInit() {
    this.commandContext$.pipe(
      filter((x): x is CommandContextModel<CommandParams> => !!x),
      takeUntil(this.destroy$)
    ).subscribe(context => {
      this.initCommandForm(context);
    });

    this.service.priceSelected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(price => {
      this.form.get('price')?.setValue(price);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.commandContext$.complete();
    this.evaluation$.complete();
  }

  private setLimitCommand(commandContext: CommandContextModel<CommandParams>): void {
    if (!this.form.valid) {
      this.service.setLimitCommand(null);
      return;
    }

    const formValue = this.form.value as LimitFormData;

    if (commandContext.commandParameters && commandContext.commandParameters.user) {
      const newCommand: LimitCommand = {
        side: 'buy',
        quantity: Number(formValue.quantity),
        price: Number(formValue.price),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: formValue.instrumentGroup ?? commandContext.commandParameters.instrument.instrumentGroup
        },
        user: commandContext.commandParameters.user
      };

      this.updateEvaluation(newCommand, commandContext);
      this.service.setLimitCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private buildForm(initialParameters: CommandParams) {
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
        initialParameters.price ?? 1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]
      ),
      instrumentGroup: new FormControl(initialParameters.instrument.instrumentGroup),
    } as LimitFormControls) as LimitFormGroup;
  }

  private updateEvaluation(command: LimitCommand, commandContext: CommandContextModel<CommandParams>) {
    const evaluation: EvaluationBaseProperties = {
      price: command.price,
      lotQuantity: command.quantity,
      instrument: {
        ...command.instrument
      },
      instrumentCurrency: commandContext.instrument?.currency
    };

    if (evaluation.price > 0) {
      this.evaluation$.next(evaluation);
    }
  }

  private initCommandForm(commandContext: CommandContextModel<CommandParams>) {
    this.form = this.buildForm(commandContext.commandParameters);
    this.setLimitCommand(commandContext);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged<LimitFormData>((prev, curr) =>
        prev?.price == curr?.price
        && prev?.quantity == curr?.quantity
        && prev?.instrumentGroup == curr?.instrumentGroup
      )
    ).subscribe(() => {
      this.setLimitCommand(commandContext);
    });
  }
}
