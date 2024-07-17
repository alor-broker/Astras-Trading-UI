import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { PortfolioCurrencySettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  FormBuilder,
  NG_VALUE_ACCESSOR,
  Validators
} from '@angular/forms';
import {
  combineLatest,
  forkJoin,
  Observable,
  of,
  switchMap,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { MarketService } from '../../../../shared/services/market.service';
import {
  CurrencyPair,
  ExchangeRateService
} from '../../../../shared/services/exchange-rate.service';
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
export class PortfoliosCurrencyFormComponent extends ControlValueAccessorBaseComponent<PortfolioCurrencySettings[]> implements OnInit {
  readonly form = this.formBuilder.array([
    this.formBuilder.group({
      portfolio: this.formBuilder.nonNullable.control({ portfolio: '', exchange: '' }),
      currency: this.formBuilder.nonNullable.control(''),
    })
  ]);

  currencies$!: Observable<CurrencyPair[]>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly marketService: MarketService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly destroyRef: DestroyRef
  ) {
    super();
  }

  writeValue(value: PortfolioCurrencySettings[] | null): void {
    this.setFormValue(value);
  }

  ngOnInit(): void {
    this.currencies$ = combineLatest(
      {
        allCurrencies: this.exchangeRateService.getCurrencyPairs(),
        marketSettings: this.marketService.getMarketSettings()
      }
    ).pipe(
      map(x => {
        const knownCurrencies = new Set(x.marketSettings.currencies.portfolioCurrencies.map(c => c.positionSymbol));

        return [
          ...x.allCurrencies.filter(c => c.secondCode === x.marketSettings.currencies.baseCurrency && knownCurrencies.has(c.firstCode)),
          {
            firstCode: x.marketSettings.currencies.baseCurrency,
            secondCode: x.marketSettings.currencies.baseCurrency,
            symbolTom: x.marketSettings.currencies.baseCurrency
          }
        ];
      })
    );

    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkIfTouched();
      this.emitValue(
        this.form.valid
          ? (this.form.value ?? []) as PortfolioCurrencySettings[]
          : null
      );
    });

    this.setFormValue(null);
  }

  protected needMarkTouched(): boolean {
    return this.form.touched;
  }

  private setFormValue(currentValue: PortfolioCurrencySettings[] | null): void {
    this.getPortfolioCurrencies(currentValue ?? []).pipe(
      take(1)
    ).subscribe(portfolios => {
      this.form.clear();

      const sortedPortfolios = portfolios
        .sort((a, b) => a.portfolio.exchange.localeCompare(b.portfolio.exchange) || a.portfolio.portfolio.localeCompare(b.portfolio.portfolio));

      for (const portfolio of sortedPortfolios) {
        this.form.push(this.formBuilder.nonNullable.group({
          portfolio: this.formBuilder.nonNullable.control(portfolio.portfolio),
          currency: this.formBuilder.nonNullable.control(portfolio.currency, Validators.required),
        }));
      }
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
