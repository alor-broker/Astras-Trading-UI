import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CurrencyInstrument } from 'src/app/shared/models/enums/currencies.model';
import {
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings,
  ColumnIds
} from 'src/app/shared/models/settings/blotter-settings.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Subject,
  takeUntil
} from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";

@Component({
  selector: 'ats-blotter-settings[guid]',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less']
})
export class BlotterSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<BlotterSettings> = new EventEmitter<BlotterSettings>();
  form!: UntypedFormGroup;
  allOrdersColumns: ColumnIds[] = allOrdersColumns;
  allStopOrdersColumns: ColumnIds[] = allStopOrdersColumns;
  allTradesColumns: ColumnIds[] = allTradesColumns;
  allPositionsColumns: ColumnIds[] = allPositionsColumns;
  prevSettings?: BlotterSettings;
  exchanges: string[] = exchangesList;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      if (settings) {
        this.prevSettings = settings;
        this.form = new UntypedFormGroup({
          portfolio: new UntypedFormControl(settings.portfolio, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new UntypedFormControl(settings.exchange, Validators.required),
          ordersColumns: new UntypedFormControl(settings.ordersColumns),
          stopOrdersColumns: new UntypedFormControl(settings.stopOrdersColumns),
          tradesColumns: new UntypedFormControl(settings.tradesColumns),
          positionsColumns: new UntypedFormControl(settings.positionsColumns),
          currency: new UntypedFormControl(this.currencyToCode(settings.currency)),
          isSoldPositionsHidden: new UntypedFormControl(settings.isSoldPositionsHidden),
        });
      }
    });
  }

  codeToCurrency(code: string) {
    switch (code) {
      case 'USD':
        return CurrencyInstrument.USD;
      case 'EUR':
        return CurrencyInstrument.EUR;
      default:
        return CurrencyInstrument.RUB;
    }
  }

  currencyToCode(currency: CurrencyInstrument) {
    switch (currency) {
      case CurrencyInstrument.USD:
        return 'USD';
      case CurrencyInstrument.EUR:
        return 'EUR';
      default:
        return 'RUB';
    }
  }

  submitForm(): void {
    this.form.value.currency = this.codeToCurrency(this.form.value.currency);
    this.settingsService.updateSettings(
      this.guid,
      {
        ...this.form.value,
        linkToActive: false
      }
    );

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
