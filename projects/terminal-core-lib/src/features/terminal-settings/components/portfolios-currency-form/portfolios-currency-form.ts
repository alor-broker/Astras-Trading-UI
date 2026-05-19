import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {PortfolioCurrencySettings} from '../../terminal-settings.types';
import {
  FormBuilder,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {PortfoliosStoreFacade} from '../../../portfolios/store/portfolios-store-facade';
import {MarketService} from '../../../market-config/market.service';
import {
  combineLatest,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take
} from 'rxjs';
import {ExchangeRateService} from '../../../exchange-rate/services/exchange-rate.service';
import {CurrencyPair} from '../../../exchange-rate/services/exchange-rate-service.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzFormModule} from 'ng-zorro-antd/form';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';

@Component({
  selector: 'ats-portfolios-currency-form',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzTypographyComponent,
    NzSelectComponent,
    NzOptionComponent,
    ReactiveFormsModule,
    NzFormModule
  ],
  templateUrl: './portfolios-currency-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => PortfoliosCurrencyForm),
    }
  ],
})
export class PortfoliosCurrencyForm extends ControlValueAccessorBase<PortfolioCurrencySettings[]> implements OnInit {
  currencies$!: Observable<CurrencyPair[]>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.array([
    this.formBuilder.group({
      portfolio: this.formBuilder.nonNullable.control({portfolio: '', exchange: ''}),
      currency: this.formBuilder.nonNullable.control(''),
    })
  ]);

  private readonly marketService = inject(MarketService);

  private readonly exchangeRateService = inject(ExchangeRateService);

  private readonly userPortfoliosService = inject(PortfoliosStoreFacade);

  private readonly destroyRef = inject(DestroyRef);

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
          ...(x.allCurrencies ?? []).filter(c => c.secondCode === x.marketSettings.currencies.baseCurrency && knownCurrencies.has(c.firstCode)),
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
    return this.userPortfoliosService.portfolios$
      .pipe(
        switchMap(portfolios => {
          if (portfolios.length === 0) {
            return of([]);
          }

          return forkJoin(
            portfolios.map(portfolio =>
              this.marketService.getExchangeSettingsIfExists(portfolio.exchange)
                .pipe(
                  map(p => {
                    if (p == null) {
                      return null;
                    }

                    const existingSettings = currentSettings.find(
                      pc => pc.portfolio.portfolio === portfolio.portfolio && pc.portfolio.exchange === portfolio.exchange
                    );

                    return existingSettings ?? {portfolio, currency: p.defaultPortfolioCurrencyInstrument};
                  })
                )
            )
          ).pipe(
            map(x => x.filter(p => p != null))
          );
        })
      );
  }
}

