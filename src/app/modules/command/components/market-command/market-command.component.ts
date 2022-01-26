import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, map, Observable, of, Subscription } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { Side } from 'src/app/shared/models/enums/side.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { MarketFormControls, MarketFormGroup } from '../../models/command-forms.model';
import { MarketFormData } from '../../models/market-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-market-command',
  templateUrl: './market-command.component.html',
  styleUrls: ['./market-command.component.less']
})
export class MarketCommandComponent implements OnInit {
  viewData = new BehaviorSubject<CommandParams | null>(null)
  initialParams: CommandParams | null = null
  initialParamsSub?: Subscription
  formChangeSub?: Subscription
  form!: MarketFormGroup;

  price$ = of(0)

  constructor(
    private sync: SyncService,
    private service: CommandsService,
    private quoteService: QuotesService,) { }

  ngOnInit(): void {
    this.initialParamsSub = this.sync.commandParams$.subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          type: CommandType.Market,
          quantity: 1,
        }

        this.price$ = this.quoteService.getQuotes(
          command.instrument.symbol,
          command.instrument.exchange,
          command.instrument.instrumentGroup).pipe(
            map(q => q.last_price)
        )
        this.viewData.next(command)
        this.setMarketCommand(command)
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
          } as MarketFormControls) as MarketFormGroup;
        }
      })
    this.formChangeSub = this.form.valueChanges.subscribe((form : MarketFormData) => this.setMarketCommand(form))
  }

  setMarketCommand(form: MarketFormData): void {
    const command = this.viewData.getValue();
    if (command && command.user) {
      const newCommand = {
        side: 'buy',
        quantity: form.quantity ?? command?.quantity ?? 0,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
        user: command.user,
      }
      this.service.setMarketCommand(newCommand);
    }
    else console.error('Empty command')
  }
}
