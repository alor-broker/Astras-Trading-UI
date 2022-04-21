import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { distinct, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.less']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  evaluation = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  viewData = new BehaviorSubject<CommandParams | null>(null);
  initialParams: CommandParams | null = null;
  form!: LimitFormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private modal: ModalService, private service: CommandsService) {
  }

  ngOnInit() {
    this.modal.commandParams$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          type: CommandType.Limit,
          price: this.initialParams.price ?? 1,
          quantity: this.initialParams.quantity ?? 1,
        };
        this.viewData.next(command);
        this.setLimitCommand(command);
      }
    });

    this.viewData.pipe(
      filter((d): d is CommandParams => !!d),
      takeUntil(this.destroy$),
    ).subscribe(command => {
      if (command) {
        this.form = new FormGroup({
          quantity: new FormControl(command.quantity, [
            Validators.required, Validators.min(0), Validators.max(1000000000)
          ]),
          price: new FormControl(command.price, [
            Validators.required, Validators.min(0), Validators.max(1000000000)
          ]),
          instrumentGroup: new FormControl(command?.instrument.instrumentGroup),
        } as LimitFormControls) as LimitFormGroup;
      }
    });

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) => prev?.price == curr?.price && prev?.quantity == curr?.quantity)
    ).subscribe((form: LimitFormData) => {
      if (this.form.valid) {
        this.setLimitCommand(form);
      }
    });
  }

  setLimitCommand(form: LimitFormData): void {
    const command = this.viewData.getValue();
    const price = Number(form.price ?? command?.price ?? 1);
    const quantity = Number(form.quantity ?? command?.quantity ?? 1);
    if (command && command.user) {
      const newCommand = {
        side: 'buy',
        quantity: quantity,
        price: price,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
        user: command.user,
      };
      const evaluation: EvaluationBaseProperties = {
        price: price,
        lotQuantity: quantity,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
      };
      if (evaluation.price > 0) {
        this.evaluation.next(evaluation);
      }
      this.service.setLimitCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.evaluation.complete();
    this.viewData.complete();
  }
}
