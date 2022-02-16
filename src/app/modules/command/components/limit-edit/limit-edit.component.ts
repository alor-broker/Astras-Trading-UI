import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-edit',
  templateUrl: './limit-edit.component.html',
  styleUrls: ['./limit-edit.component.less']
})
export class LimitEditComponent implements OnInit, OnDestroy {
  viewData = new BehaviorSubject<EditParams | null>(null)
  initialParams: EditParams | null = null
  initialParamsSub?: Subscription
  formChangeSub?: Subscription
  form!: LimitFormGroup;

  constructor(private modal: ModalService, private service: CommandsService) { }

  ngOnInit() {
    this.initialParamsSub = this.modal.editParams$.subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          type: CommandType.Limit.toString().toLowerCase(),
          price: this.initialParams.price ?? 0,
          quantity: this.initialParams.quantity ?? 1,
          orderId: this.initialParams.orderId
        }
        this.viewData.next(command)
        this.setLimitEdit(command)
      }
    })
    this.viewData.pipe(
      filter((d): d is EditParams => !!d)
    ).subscribe(command => {
        if (command) {
          this.form = new FormGroup({
            quantity: new FormControl(command.quantity, [
              Validators.required,
            ]),
            price: new FormControl(command.price, [
              Validators.required,
            ])
          } as LimitFormControls) as LimitFormGroup;
        }
      })
    this.formChangeSub = this.form.valueChanges.subscribe((form : LimitFormData) => this.setLimitEdit(form))
  }

  setLimitEdit(form: LimitFormData): void {
    const command = this.viewData.getValue();
    if (command && command.user) {
      const newCommand = {
        quantity: form.quantity ?? command?.quantity ?? 0,
        price: form.price ?? command?.price ?? 0,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
        user: command.user,
        id: command.orderId
      }
      this.service.setLimitEdit(newCommand);
    }
    else console.error('Empty command')
  }

  ngOnDestroy(): void {
    this.initialParamsSub?.unsubscribe();
    this.formChangeSub?.unsubscribe();
  }
 }
