import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  Observable,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { MarketFormControls, MarketFormGroup } from '../../models/command-forms.model';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { MarketFormData } from '../../models/market-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { MarketCommand } from '../../models/market-command.model';
import { distinct, finalize } from 'rxjs/operators';

@Component({
  selector: 'ats-market-command',
  templateUrl: './market-command.component.html',
  styleUrls: ['./market-command.component.less']
})
export class MarketCommandComponent implements OnInit, OnDestroy {
  evaluation$!: Observable<EvaluationBaseProperties | null>;
  form!: MarketFormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private lastCommand$ = new BehaviorSubject<MarketCommand | null>(null);
  private isActivated$ = new Subject<boolean>();

  constructor(
    private modal: ModalService,
    private service: CommandsService,
    private quoteService: QuotesService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.modal.commandParams$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(initial => {
      this.initCommandForm(initial);
    });

    this.initEvaluationUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.lastCommand$.complete();
  }

  setMarketCommand(initialParameters: CommandParams): void {
    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.value as MarketFormData;
    const quantity = Number(formValue.quantity ?? initialParameters?.quantity ?? 1);

    if (initialParameters && initialParameters.user) {
      const newCommand: MarketCommand = {
        side: 'buy',
        quantity: Number(quantity),
        instrument: {
          ...initialParameters.instrument,
          instrumentGroup: formValue.instrumentGroup ?? initialParameters.instrument.instrumentGroup
        },
        user: initialParameters.user
      };

      // save last command parameters to update evaluation
      this.lastCommand$.next(newCommand);
      this.service.setMarketCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private buildEvaluationProperties(command: MarketCommand | null, price: number): EvaluationBaseProperties {
    return {
      price: price,
      lotQuantity: command?.quantity,
      instrument: {
        ...command?.instrument
      },
    } as EvaluationBaseProperties;
  }

  private buildForm(initialParameters: CommandParams) {
    return new FormGroup({
      quantity: new FormControl(
        initialParameters.quantity ?? 1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]
      ),
      instrumentGroup: new FormControl(initialParameters.instrument.instrumentGroup),
    } as MarketFormControls) as MarketFormGroup;
  }

  private initEvaluationUpdates() {
    const currentInstrumentPrice$ = this.lastCommand$.pipe(
      distinctUntilChanged((previous, current) =>
        previous?.instrument?.symbol == current?.instrument?.symbol
        && previous?.instrument?.exchange == current?.instrument?.exchange
        && previous?.instrument?.instrumentGroup == current?.instrument?.instrumentGroup
      ),
      switchMap(command => this.getCurrentPrice(command)),
      distinct()
    );

    this.evaluation$ = combineLatest([
      this.lastCommand$,
      currentInstrumentPrice$,
      this.isActivated$
    ]).pipe(
      filter(([, , isActivated]) => isActivated),
      map(([command, price,]) => this.buildEvaluationProperties(command, price)),
      filter(e => e.price > 0)
    );
  }

  private initCommandForm(initialParameters: CommandParams | null) {
    if (!initialParameters) {
      return;
    }

    this.form = this.buildForm(initialParameters);
    this.setMarketCommand(initialParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged<MarketFormData>((prev, curr) =>
        prev?.quantity == curr?.quantity
        && prev?.instrumentGroup == curr?.instrumentGroup
      )
    ).subscribe(() => {
      this.setMarketCommand(initialParameters);
    });
  }

  private getCurrentPrice(command: MarketCommand | null): Observable<number> {
    if (!command) {
      return EMPTY;
    }

    return this.quoteService.getQuotes(command.instrument.symbol, command.instrument.exchange, command.instrument.instrumentGroup)
      .pipe(
        map(q => q.last_price),
        finalize(() => this.quoteService.unsubscribe()),
      );
  }
}
