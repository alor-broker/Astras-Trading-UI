import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { PortfolioCurrencySettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  AbstractControl,
  NG_VALUE_ACCESSOR,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {
  combineLatest,
  forkJoin,
  Observable,
  of,
  Subscription,
  switchMap,
  take
} from 'rxjs';
import {
  map
} from 'rxjs/operators';
import { MarketService } from '../../../../shared/services/market.service';
import {
  CurrencyPair,
  ExchangeRateService
} from '../../../../shared/services/exchange-rate.service';
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";

@Component({
  selector: 'ats-portfolios-currency-form',
  templateUrl: './portfolios-currency-form.component.html',
  styleUrls: ['./portfolios-currency-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: PortfoliosCurrencyFormComponent
    }
  ]
})
export class PortfoliosCurrencyFormComponent extends ControlValueAccessorBaseComponent<PortfolioCurrencySettings[]> implements OnInit, OnDestroy {
  form?: UntypedFormArray;
  currencies$!: Observable<CurrencyPair[]>;

  private formSubscriptions?: Subscription;

  constructor(
    private readonly marketService: MarketService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
    super();
  }

  writeValue(value: PortfolioCurrencySettings[] | null): void {
    this.initForm(value);
  }

  ngOnInit(): void {
    this.currencies$ = combineLatest(
      {
        allCurrencies: this.exchangeRateService.getCurrencyPairs(),
        marketSettings: this.marketService.getMarketSettings()
      }
    ).pipe(
        map(x => ([
          ...x.allCurrencies.filter(c => c.secondCode === x.marketSettings.currencies.baseCurrency),
          {
            firstCode: x.marketSettings.currencies.baseCurrency,
            secondCode: x.marketSettings.currencies.baseCurrency,
            symbolTom: x.marketSettings.currencies.baseCurrency
          }
        ]))
      );

    this.initForm(null);
  }

  ngOnDestroy(): void {
    this.formSubscriptions?.unsubscribe();
  }

  asFormGroup(ctrl: AbstractControl): UntypedFormGroup {
    return ctrl as UntypedFormGroup;
  }

  asControl(ctrl: AbstractControl): UntypedFormControl {
    return ctrl as UntypedFormControl;
  }

  protected needMarkTouched(): boolean {
    if (!this.form) {
      return false;
    }

    return this.form.touched;
  }

  private initForm(currentValue: PortfolioCurrencySettings[] | null): void {
    this.getPortfolioCurrencies(currentValue ?? []).pipe(
      take(1)
    ).subscribe(portfolios => {
      this.form = new UntypedFormArray(
        portfolios
          .sort((a, b) => a.portfolio.exchange.localeCompare(b.portfolio.exchange) || a.portfolio.portfolio.localeCompare(b.portfolio.portfolio))
          .map(p => new UntypedFormGroup({
          currency: new UntypedFormControl(p.currency, Validators.required),
          portfolio: new UntypedFormControl(p.portfolio)
        }))
      );

      const emit = (): void => {
        this.emitValue(
          this.form!.valid
            ? (this.form!.value ?? []) as PortfolioCurrencySettings[]
            : null
        );
      };

      this.formSubscriptions?.unsubscribe();
      this.formSubscriptions = this.form.valueChanges.subscribe(() => {
        this.checkIfTouched();
        emit();
      });

      emit();
    });
  }

  private getPortfolioCurrencies(currentSettings: PortfolioCurrencySettings[]): Observable<PortfolioCurrencySettings[]> {
    return this.userPortfoliosService.getPortfolios()
      .pipe(
        switchMap(portfolios => {
          if (portfolios.length === 0) {
            return of([]);
          }

          return forkJoin(
            portfolios.map(portfolio =>
              this.marketService.getExchangeSettings(portfolio.exchange)
                .pipe(map(p => {
                  const existingSettings = currentSettings.find(
                    pc => pc.portfolio.portfolio === portfolio.portfolio && pc.portfolio.exchange === portfolio.exchange
                  );

                  return existingSettings ?? { portfolio, currency: p.defaultPortfolioCurrencyInstrument };
                }))
            )
          );
        })
      );
  }
}
