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
  Observable,
  shareReplay,
  Subject,
  take,
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
  private settings$!: Observable<BlotterSettings>;

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
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
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const newSettings = {
          ...this.form.value,
          currency: this.codeToCurrency(this.form.value.currency)
      };

      newSettings.linkToActive = initialSettings.linkToActive && this.isPortfolioEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<BlotterSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private isPortfolioEqual(settings1: BlotterSettings, settings2: BlotterSettings) {
    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
  }
}
