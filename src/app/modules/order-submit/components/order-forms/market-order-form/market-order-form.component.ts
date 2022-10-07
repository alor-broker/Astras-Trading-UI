import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { OrderFormBaseComponent } from "../order-form-base.component";
import { MarketOrder } from "../../../../command/models/order.model";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import {
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  switchMap,
  takeUntil
} from "rxjs";
import { EvaluationBaseProperties } from "../../../../command/models/evaluation-base-properties.model";
import { finalize } from "rxjs/operators";
import { QuotesService } from "../../../../../shared/services/quotes.service";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { InstrumentKey } from "../../../../../shared/models/instruments/instrument-key.model";
import { GuidGenerator } from "../../../../../shared/utils/guid";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../../shared/models/form.model';

export type MarketOrderFormValue = Omit<MarketOrder, 'instrument' | 'side'> & { instrumentGroup: string };

@Component({
  selector: 'ats-market-order-form',
  templateUrl: './market-order-form.component.html',
  styleUrls: ['./market-order-form.component.less'],
  providers: [QuotesService]
})
export class MarketOrderFormComponent extends OrderFormBaseComponent<MarketOrderFormValue> implements OnInit, OnDestroy {
  evaluation$!: Observable<EvaluationBaseProperties | null>;
  private readonly componentGuid = GuidGenerator.newGuid();
  private lastFormValue$ = new BehaviorSubject<MarketOrderFormValue | null>(null);

  constructor(private readonly quoteService: QuotesService
  ) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.initEvaluationUpdates();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.lastFormValue$.complete();
  }

  protected buildForm(instrument: Instrument): FormGroup<ControlsOf<MarketOrderFormValue>> {
    return new FormGroup<ControlsOf<MarketOrderFormValue>>({
      quantity: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      instrumentGroup: new FormControl(instrument.instrumentGroup ?? ''),
    });
  }

  protected getFormValue(): MarketOrderFormValue | null {
    const formValue = super.getFormValue();
    if (!formValue) {
      return formValue;
    }

    return {
      ...formValue,
      quantity: Number(formValue.quantity)
    };
  }

  protected onFormValueEmitted(value: MarketOrderFormValue | null) {
    this.lastFormValue$.next(value);
  }

  private initEvaluationUpdates() {
    const currentInstrumentPrice$ = this.lastFormValue$.pipe(
      distinctUntilChanged((previous, current) =>
        previous?.instrumentGroup === current?.instrumentGroup
        && previous?.quantity === current?.quantity),
      mapWith(() => this.instrument$, (formValue, instrument) => ({ formValue, instrument })),
      mapWith(
        ({ formValue, instrument }) => this.getCurrentPrice(instrument, formValue),
        (source, price) => ({
          instrument: source.instrument,
          formValue: source.formValue,
          currentPrice: price
        }))
    );

    this.evaluation$ = this.isActivated$.pipe(
      filter(x => x),
      switchMap(() => currentInstrumentPrice$),
      map(({ instrument, formValue, currentPrice }) => {
        if (!instrument || !formValue || !currentPrice) {
          return null;
        }

        return {
          price: currentPrice,
          lotQuantity: formValue.quantity,
          instrument: {
            symbol: instrument.symbol,
            exchange: instrument.exchange,
            instrumentGroup: formValue.instrumentGroup ?? instrument.instrumentGroup
          } as InstrumentKey,
          instrumentCurrency: instrument.currency
        } as EvaluationBaseProperties;
      })
    );
  }

  private getCurrentPrice(instrument: Instrument | null, formValue: MarketOrderFormValue | null): Observable<number | null> {
    if (!formValue || !instrument) {
      return of(null);
    }

    const isDeactivated$ = this.isActivated$.pipe(
      filter(x => !x)
    );

    return this.quoteService.getQuotes(instrument.symbol, instrument.exchange, formValue.instrumentGroup, this.componentGuid)
      .pipe(
        map(q => q.last_price),
        finalize(() => this.quoteService.unsubscribe()),
        takeUntil(isDeactivated$)
      );
  }
}
