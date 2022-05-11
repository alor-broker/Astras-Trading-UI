import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import { ModalService } from 'src/app/shared/services/modal.service';
import { addDays } from 'src/app/shared/utils/datetime';
import { StopFormControls, StopFormGroup } from '../../models/command-forms.model';
import { StopFormData } from '../../models/stop-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { StopCommand } from '../../models/stop-command.model';

@Component({
  selector: 'ats-stop-command',
  templateUrl: './stop-command.component.html',
  styleUrls: ['./stop-command.component.less']
})
export class StopCommandComponent implements OnInit, OnDestroy {
  form!: StopFormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private modal: ModalService, private service: CommandsService) {
  }

  ngOnInit() {
    this.modal.commandParams$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(initial => {
      this.initCommandForm(initial);
    });
  }

  setStopCommand(initialParameters: CommandParams): void {
    if (!this.form.valid) {
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
        stopEndUnixTime: !formValue.stopEndUnixTime ? addDays(new Date(), 30) : formValue.stopEndUnixTime,
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
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
      stopEndUnixTime: new FormControl(initialParameters.stopEndUnixTime),
      condition: new FormControl(StopOrderCondition.More),
      withLimit: new FormControl(false)
    } as StopFormControls) as StopFormGroup;
  }

  private initCommandForm(initialParameters: CommandParams | null) {
    if (!initialParameters) {
      return;
    }

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
