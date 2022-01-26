import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { Side } from 'src/app/shared/models/enums/side.model';
import { Quote } from 'src/app/shared/models/quotes/quote.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { LimitCommand } from '../../models/limit-command.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.less']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  viewData = new BehaviorSubject<CommandParams | null>(null)
  initialParams: CommandParams | null = null
  initialParamsSub?: Subscription
  formChangeSub?: Subscription
  form!: LimitFormGroup;

  constructor(private sync: SyncService, private service: CommandsService) { }

  ngOnInit() {
    this.initialParamsSub = this.sync.commandParams$.subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          side: this.initialParams.side,
          type: CommandType.Limit,
          price: this.initialParams.price ?? 0,
          quantity: 1,
        }
        this.viewData.next(command)
        this.setLimitCommand(command)
      }
    })
    this.viewData.pipe(
      filter((d): d is CommandParams => !!d)
    ).subscribe(command => {
        if (command) {
          this.form = new FormGroup({
            quantity: new FormControl(command.quantity, [
              Validators.required,
            ]),
            price: new FormControl(command.price, [
              Validators.required,
            ]),
            instrumentGroup: new FormControl(command?.instrument.instrumentGroup),
          } as LimitFormControls) as LimitFormGroup;
        }
      })
    this.formChangeSub = this.form.valueChanges.subscribe((form : LimitFormData) => this.setLimitCommand(form))
  }

  setLimitCommand(form: LimitFormData): void {
    const command = this.viewData.getValue();
    if (command && command.user) {
      const newCommand = {
        side: command.side == Side.Buy ? 'buy' : 'sell',
        quantity: form.quantity ?? command?.quantity ?? 0,
        price: form.price ?? command?.price ?? 0,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
        user: command.user,
      }
      this.service.setLimitCommand(newCommand);
    }
    else console.error('Empty command')
  }

  ngOnDestroy(): void {
    this.initialParamsSub?.unsubscribe();
    this.formChangeSub?.unsubscribe();
  }
 }
