import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { Side } from 'src/app/shared/models/enums/side.model';
import { Quote } from 'src/app/shared/models/quotes/quote.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { LimitCommand } from '../../models/limit-command.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.sass']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  viewData = new BehaviorSubject<CommandParams | null>(null)
  initialParams: CommandParams | null = null
  initialParamsSub: Subscription
  form!: FormGroup;

  constructor(private sync: SyncService, private service: CommandsService, private quotes: QuotesService) {
    this.initialParamsSub = this.sync.commandParams$.subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        this.viewData.next({
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          side: this.initialParams.side,
          type: CommandType.Limit,
          price: this.initialParams.price ?? 0,
          quantity: 1,
        })
      }
    })
   }

   ngOnInit() {
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
         });
       }
     })
   }

   submitForm(): void {
     const command = this.viewData.getValue();
     if (command && command.user) {
      this.service.submitLimit({
        side: command.side == Side.Buy ? 'buy' : 'sell',
        quantity: command.quantity,
        price: command.price,
        instrument: command.instrument,
        user: command.user,
        ...this.form.value
      }).subscribe();
     }
     else console.error('Empty command')
   }

  ngOnDestroy(): void {
    this.initialParamsSub.unsubscribe();
  }
}
