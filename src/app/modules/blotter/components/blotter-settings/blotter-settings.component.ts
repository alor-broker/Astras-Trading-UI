import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  FormControl,
  FormGroup,
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
  form!: FormGroup;
  allOrdersColumns: ColumnIds[] = allOrdersColumns;
  allStopOrdersColumns: ColumnIds[] = allStopOrdersColumns;
  allTradesColumns: ColumnIds[] = allTradesColumns;
  allPositionsColumns: ColumnIds[] = allPositionsColumns;
  prevSettings?: BlotterSettings;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingService.getSettings<BlotterSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      if (settings) {
        this.prevSettings = settings;
        this.form = new FormGroup({
          portfolio: new FormControl(settings.portfolio, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
          ordersColumns: new FormControl(settings.ordersColumns),
          stopOrdersColumns: new FormControl(settings.stopOrdersColumns),
          tradesColumns: new FormControl(settings.tradesColumns),
          positionsColumns: new FormControl(settings.positionsColumns),
          currency: new FormControl(this.currencyToCode(settings.currency)),
          isSoldPositionsHidden: new FormControl(settings.isSoldPositionsHidden),
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
    this.settingService.updateSettings(
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
