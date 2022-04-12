import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import { ModalService } from 'src/app/shared/services/modal.service';
import { addDays } from 'src/app/shared/utils/datetime';
import { StopFormControls, StopFormGroup } from '../../models/command-forms.model';
import { StopFormData } from '../../models/stop-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { LoggerService } from "../../../../shared/services/logger.service";

@Component({
  selector: 'ats-stop-command',
  templateUrl: './stop-command.component.html',
  styleUrls: ['./stop-command.component.less']
})
export class StopCommandComponent implements OnInit, OnDestroy {
  viewData = new BehaviorSubject<CommandParams | null>(null)
  initialParams: CommandParams | null = null
  form!: StopFormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private modal: ModalService,
    private service: CommandsService,
    private logger: LoggerService) {
  }

  ngOnInit() {
    this.modal.commandParams$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          type: CommandType.Stop,
          price: this.initialParams.price ?? 0,
          quantity: this.initialParams.quantity ?? 1,
          triggerPrice: this.initialParams.price ?? 1,
          condition: StopOrderCondition.More
        }
        this.viewData.next(command)
        this.setStopCommand(command)
      }
    });

    this.viewData.pipe(
      filter((d): d is CommandParams => !!d),
      takeUntil(this.destroy$)
    ).subscribe(command => {
      if (command) {
        this.form = new FormGroup({
          quantity: new FormControl(command.quantity, [
            Validators.required, Validators.min(0),
          ]),
          price: new FormControl(command.price),
          triggerPrice: new FormControl(command.price, [
            Validators.required, Validators.min(0),
          ]),
          stopEndUnixTime: new FormControl(command.stopEndUnixTime),
          condition: new FormControl(StopOrderCondition.More),
        } as StopFormControls) as StopFormGroup;
      }
    });

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((form: StopFormData) => this.setStopCommand(form))
  }

  setStopCommand(form: StopFormData): void {
    const command = this.viewData.getValue();
    if (command && command.user) {
      const price = Number(form.price);
      const newCommand = {
        side: 'buy',
        quantity: Number(form.quantity) ?? command?.quantity ?? 1,
        triggerPrice: Number(form.triggerPrice) ?? command?.price ?? 0,
        condition: form.condition,
        stopEndUnixTime: form.stopEndUnixTime ?? addDays(new Date(), 30),
        price: price == 0 ? null : price,
        instrument: {
          ...command.instrument
        },
        user: command.user,
      }
      this.service.setStopCommand(newCommand);
    }
    else {
      this.logger.error('Empty command');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.viewData.complete()
  }
}
