import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
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
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { MarketFormData } from '../../models/market-form-data.model';
import { CommandsService } from '../../services/commands.service';
import { MarketCommand } from '../../models/market-command.model';
import { distinct } from 'rxjs/operators';
import { CommandContextModel } from '../../models/command-context.model';
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../shared/models/form.model';
import { EvaluationBaseProperties } from '../../../../shared/models/evaluation-base-properties.model';

@Component({
  selector: 'ats-market-command',
  templateUrl: './market-command.component.html',
  styleUrls: ['./market-command.component.less']
})
export class MarketCommandComponent implements OnInit, OnDestroy {
  evaluation$!: Observable<EvaluationBaseProperties | null>;
  form!: FormGroup<ControlsOf<MarketFormData>>;
  commandContext$ = new BehaviorSubject<CommandContextModel<CommandParams> | null>(null);
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private lastCommand$ = new BehaviorSubject<MarketCommand | null>(null);
  private isActivated$ = new BehaviorSubject<boolean>(false);

  constructor(
    private service: CommandsService,
    private quoteService: QuotesService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  @Input()
  set commandContext(value: CommandContextModel<CommandParams>) {
    this.commandContext$.next(value);
  }

  @Input()
  set quantity(value: {quantity: number} | null){
    if(value?.quantity != null) {
      this.quantitySelect(value.quantity);
    }
  }

  ngOnInit(): void {
    this.commandContext$.pipe(
      filter((x): x is CommandContextModel<CommandParams> => !!x),
      takeUntil(this.destroy$)
    ).subscribe(context => {
      this.initCommandForm(context.commandParameters);
      this.initEvaluationUpdates(context);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.lastCommand$.complete();
    this.commandContext$.complete();
    this.isActivated$.complete();
  }

  quantitySelect(qty: number) {
    this.form.get('quantity')?.setValue(qty);
  }

  private setMarketCommand(initialParameters: CommandParams): void {
    if (!this.form.valid) {
      this.service.setMarketCommand(null);
      return;
    }

    const formValue = this.form.value as MarketFormData;
    const quantity = Number(formValue.quantity ?? initialParameters?.quantity ?? 1);

    if (initialParameters && initialParameters.user) {
      const newCommand: MarketCommand = {
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

  private buildEvaluationProperties(command: MarketCommand | null, commandContext: CommandContextModel<CommandParams>, price: number): EvaluationBaseProperties {
    return {
      price: price,
      lotQuantity: command?.quantity,
      instrument: {
        ...command?.instrument
      },
      instrumentCurrency: commandContext.instrument.currency
    } as EvaluationBaseProperties;
  }

  private buildForm(initialParameters: CommandParams): FormGroup<ControlsOf<MarketFormData>> {
    return new FormGroup<ControlsOf<MarketFormData>>({
      quantity: new FormControl(
        initialParameters.quantity ?? 1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      instrumentGroup: new FormControl(initialParameters.instrument.instrumentGroup),
    });
  }

  private initEvaluationUpdates(commandContext: CommandContextModel<CommandParams>) {
    const currentInstrumentPrice$ = this.lastCommand$.pipe(
      distinctUntilChanged((previous, current) =>
        previous?.instrument?.symbol == current?.instrument?.symbol
        && previous?.instrument?.exchange == current?.instrument?.exchange
        && previous?.instrument?.instrumentGroup == current?.instrument?.instrumentGroup
      ),
      switchMap(command => this.getCurrentPrice(command))
    );

    this.evaluation$ = combineLatest([
      this.lastCommand$,
      currentInstrumentPrice$,
      this.isActivated$
    ]).pipe(
      filter(([, , isActivated]) => isActivated),
      map(([command, price,]) => this.buildEvaluationProperties(command, commandContext, price)),
      filter(e => e.price > 0)
    );
  }

  private initCommandForm(initialParameters: CommandParams) {

    this.form = this.buildForm(initialParameters);
    this.setMarketCommand(initialParameters);

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) =>
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
        distinct()
      );
  }
}
