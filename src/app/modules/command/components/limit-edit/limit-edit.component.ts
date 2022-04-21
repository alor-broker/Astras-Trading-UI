import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-edit',
  templateUrl: './limit-edit.component.html',
  styleUrls: ['./limit-edit.component.less']
})
export class LimitEditComponent implements OnInit, OnDestroy {
  evaluation = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  viewData = new BehaviorSubject<EditParams | null>(null);
  initialParams: EditParams | null = null;
  form!: LimitFormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private modal: ModalService, private service: CommandsService) {
  }

  ngOnInit() {
    this.modal.editParams$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          type: CommandType.Limit.toString().toLowerCase(),
          price: this.initialParams.price ?? 1,
          quantity: this.initialParams.quantity ?? 1,
          orderId: this.initialParams.orderId,
          side: this.initialParams.side
        };
        this.viewData.next(command);
        this.setLimitEdit(command);
      }
    });

    this.viewData.pipe(
      filter((d): d is EditParams => !!d),
      takeUntil(this.destroy$)
    ).subscribe(command => {
      if (command) {
        this.form = new FormGroup({
          quantity: new FormControl(command.quantity, [
            Validators.required, Validators.min(0), Validators.max(1000000000)
          ]),
          price: new FormControl(command.price, [
            Validators.required, Validators.min(0), Validators.max(1000000000)
          ])
        } as LimitFormControls) as LimitFormGroup;
      }
    });

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) => prev?.price == curr?.price && prev?.quantity == curr?.quantity),
    ).subscribe((form: LimitFormData) => {
      if (this.form.valid) {
        this.setLimitEdit(form);
      }
    });
  }

  setLimitEdit(form: LimitFormData): void {
    const command = this.viewData.getValue();
    const price = Number(form.price ?? command?.price ?? 1);
    const quantity = Number(form.quantity ?? command?.quantity ?? 1);
    if (command && command.user) {
      const newCommand = {
        quantity: form.quantity ?? command?.quantity ?? 1,
        price: form.price ?? command?.price ?? 1,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
        user: command.user,
        id: command.orderId,
        side: command.side
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
      this.service.setLimitEdit(newCommand);
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
