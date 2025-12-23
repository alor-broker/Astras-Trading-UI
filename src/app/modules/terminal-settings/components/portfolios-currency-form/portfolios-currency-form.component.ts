import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import {PortfolioCurrencySettings} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators} from '@angular/forms';
import {combineLatest, forkJoin, Observable, of, switchMap, take} from 'rxjs';
import {map} from 'rxjs/operators';
import {MarketService} from '../../../../shared/services/market.service';
import {CurrencyPair, ExchangeRateService} from '../../../../shared/services/exchange-rate.service';
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {AsyncPipe} from '@angular/common';

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
  ],
  imports: [
    TranslocoDirective,
    NzTypographyComponent,
    FormsModule,
    NzFormDirective,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSelectComponent,
    ReactiveFormsModule,
    NzOptionComponent,
    AsyncPipe
  ]
})
export class PortfoliosCurrencyFormComponent extends ControlValueAccessorBaseComponent<PortfolioCurrencySettings[]> implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly marketService = inject(MarketService);
  private readonly exchangeRateService = inject(ExchangeRateService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.formBuilder.array([
    this.formBuilder.group({
      portfolio: this.formBuilder.nonNullable.control({portfolio: '', exchange: ''}),
      currency: this.formBuilder.nonNullable.control(''),
    })
  ]);

  currencies$!: Observable<CurrencyPair[]>;

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
