import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { LimitEdit } from '../../models/limit-edit.model';
import { CommandContextModel } from '../../models/command-context.model';

@Component({
  selector: 'ats-limit-edit',
  templateUrl: './limit-edit.component.html',
  styleUrls: ['./limit-edit.component.less']
})
export class LimitEditComponent implements OnInit, OnDestroy {
  evaluation$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  form!: LimitFormGroup;
  commandContext$ = new BehaviorSubject<CommandContextModel<EditParams> | null>(null);
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private service: CommandsService) {
  }

  @Input()
  set commandContext(value: CommandContextModel<EditParams>) {
    this.commandContext$.next(value);
  }

  ngOnInit() {
    this.commandContext$.pipe(
      filter((x): x is CommandContextModel<EditParams> => !!x),
      takeUntil(this.destroy$)
    ).subscribe(context => {
      this.initCommandForm(context.commandParameters);
    });
  }

  setLimitEdit(initialParameters: EditParams): void {
    if (!this.form.valid) {
      this.service.setLimitEdit(null);
      return;
    }

    const formValue = this.form.value as LimitFormData;

    if (initialParameters && initialParameters.user) {
      const newCommand: LimitEdit = {
        quantity: Number(formValue.quantity),
        price: Number(formValue.price),
        instrument: {
          ...initialParameters.instrument
        },
        user: initialParameters.user,
        id: initialParameters.orderId
      };

      this.updateEvaluation(newCommand);
      this.service.setLimitEdit(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.commandContext$.complete();
    this.evaluation$.complete();
  }

  private initCommandForm(initialParameters: EditParams | null) {
    if (!initialParameters) {
      return;
    }

    this.form = this.buildForm(initialParameters);
    this.setLimitEdit(initialParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged<LimitFormData>((prev, curr) =>
        prev?.price == curr?.price
        && prev?.quantity == curr?.quantity
      )
    ).subscribe(() => {
      this.setLimitEdit(initialParameters);
    });
  }

  private buildForm(initialParameters: EditParams) {
    return new FormGroup({
      quantity: new FormControl(
        initialParameters.quantity ?? 1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]),
      price: new FormControl(
        initialParameters.price ?? 1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ])
    } as LimitFormControls) as LimitFormGroup;
  }

  private updateEvaluation(command: LimitEdit) {
    const evaluation: EvaluationBaseProperties = {
      price: command.price,
      lotQuantity: command.quantity,
      instrument: {
        ...command.instrument
      },
    };

    if (evaluation.price > 0) {
      this.evaluation$.next(evaluation);
    }
  }
}
