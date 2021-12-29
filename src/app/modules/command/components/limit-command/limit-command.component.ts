import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { Quote } from 'src/app/shared/models/quotes/quote.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandViewData } from '../../models/command-view-data.model';
import { LimitCommand } from '../../models/limit-command.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.sass']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  isVisible$: Observable<boolean> = of(false);
  viewData = new BehaviorSubject<CommandViewData | null>(null)
  initialParams: CommandParams | null = null
  initialParamsSub: Subscription
  form!: FormGroup;

  constructor(private sync: SyncService, private service: CommandsService, private quotes: QuotesService) {
    this.isVisible$ = this.sync.shouldShowCommandModal$;
    this.initialParamsSub = this.sync.commandParams$.subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        this.viewData.next({
          command: {
            instrument: this.initialParams?.instrument,
            user: this.initialParams.user,
            side: this.initialParams.side,
            type: CommandType.Limit,
            price: this.initialParams.price ?? 0,
            quantity: 100,
          },
        })
      }
    })
   }

   ngOnInit() {
    this.viewData.pipe(
      filter((d): d is CommandViewData => !!d),
      switchMap((data : CommandViewData) : Observable<CommandViewData> => {
        if (data.command) {
          const withQuotes = this.quotes.getQuotes(
            data.command.instrument.symbol,
            data.command.instrument.exchange,
            data.command.instrument.instrumentGroup).pipe(
              filter((q): q is Quote => !!q),
              map((quote) : CommandViewData => ({
                command: data.command,
                quote: quote
              })
            )
          );
          return withQuotes;
        }
        return of(data);
      }),
    ).subscribe(data => {
       if (data && data.command) {
         this.form = new FormGroup({
          quantity: new FormControl(data.command.quantity, [
             Validators.required,
           ]),
           price: new FormControl(data.command.price, [
              Validators.required,
            ]),
           instrumentGroup: new FormControl(data.command?.instrument.instrumentGroup),
         });
       }
     })
   }

   submitForm(): void {
     const command = this.viewData.getValue()?.command;
     if (command && command.user) {
      this.service.submitLimit({
        side: command.side,
        type: command.type,
        quantity: command.quantity,
        price: command.price,
        instrument: command.instrument,
        user: command.user
      }).subscribe();
      console.log('submit', this.form.value);
     }
     else console.error('Empty command')
   }

  ngOnDestroy(): void {
    this.initialParamsSub.unsubscribe();
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.sync.closeCommandModal();
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.sync.closeCommandModal();
  }
}
