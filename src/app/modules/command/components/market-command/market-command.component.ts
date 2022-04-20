import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter, map, of, Subject, takeUntil } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { MarketFormControls, MarketFormGroup } from '../../models/command-forms.model';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { MarketFormData } from '../../models/market-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-market-command',
  templateUrl: './market-command.component.html',
  styleUrls: ['./market-command.component.less']
})
export class MarketCommandComponent implements OnInit, OnDestroy {
  evaluation = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  viewData = new BehaviorSubject<CommandParams | null>(null)
  initialParams: CommandParams | null = null
  form!: MarketFormGroup;
  price$ = of(0)
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private modal: ModalService,
    private service: CommandsService,
    private quoteService: QuotesService) {
  }

  ngOnInit(): void {
    this.modal.commandParams$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(initial => {
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
    });

    this.viewData.pipe(
      filter((d): d is CommandParams => !!d),
      takeUntil(this.destroy$)
    ).subscribe(command => {
      if (command) {
        this.form = new FormGroup({
          quantity: new FormControl(command.quantity, [
            Validators.required, Validators.min(0), Validators.max(1000000000)
          ]),
          price: new FormControl(command.price, [
            Validators.required,
          ]),
          instrumentGroup: new FormControl(command?.instrument.instrumentGroup),
        } as MarketFormControls) as MarketFormGroup;
      }
    })

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) => prev?.price == curr?.price && prev?.quantity == curr?.quantity),
    ).subscribe((form: MarketFormData) => {
      if (this.form.valid) {
        this.setMarketCommand(form);
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.evaluation.complete();
    this.viewData.complete();
  }

  setMarketCommand(form: MarketFormData): void {
    const command = this.viewData.getValue();
    const price = Number(command?.price ?? 1);
    const quantity = Number(form.quantity ?? command?.quantity ?? 1);
    if (command && command.user) {
      const newCommand = {
        side: 'buy',
        quantity: form.quantity ?? command?.quantity ?? 1,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
        user: command.user,
      }
      const evaluation: EvaluationBaseProperties = {
        price: price,
        lotQuantity: quantity,
        instrument: {
          ...command.instrument,
          instrumentGroup: form.instrumentGroup ?? command.instrument.instrumentGroup
        },
      }
      if (evaluation.price > 0) {
        this.evaluation.next(evaluation);
      }
      this.service.setMarketCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }
}
