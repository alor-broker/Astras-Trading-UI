import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  LOCALE_ID,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  filter,
  map,
  Observable
} from "rxjs";
import {
  Descriptor,
  DescriptorsGroup
} from '../../types/instrument-descriptors.types';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {
  CostEstimate,
  DividendsAggregateInfo,
  MainIndicators,
  Profitability,
  Stock,
  Trading
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {
  CurrencyPipe,
  formatNumber,
  formatPercent
} from "@angular/common";
import {toObservable} from '@angular/core/rxjs-interop';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {DescriptorsList} from '@terminal-widgets-lib/widgets/instrument-info/components/descriptors-list/descriptors-list';
import {FinanceBarChart} from '@terminal-widgets-lib/widgets/instrument-info/components/finance-bar-chart/finance-bar-chart';
import {LetDirective} from '@ngrx/component';

@Component({
  selector: 'ats-finance',
  imports: [
    NzEmptyComponent,
    DescriptorsList,
    FinanceBarChart,
    LetDirective
  ],
  templateUrl: './finance.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Finance implements OnInit {
  descriptors$!: Observable<DescriptorsGroup[]>;

  readonly stockInfo = input.required<Stock>();

  protected readonly stockInfoChanges$ = toObservable(this.stockInfo);

  private readonly translatorService = inject(TranslatorService);

  private readonly locale = inject(LOCALE_ID);

  private readonly currencyPipe = new CurrencyPipe(this.locale);

  ngOnInit(): void {
    this.descriptors$ = combineLatest({
      stockInfo: this.stockInfoChanges$,
      translator: this.translatorService.getTranslator('info/descriptors-list')
    }).pipe(
      filter(x => x.stockInfo != null),
      map(x => this.getDescriptors(x.stockInfo!, x.translator))
    );
  }

  private getDescriptors(stock: Stock, translator: TranslatorFn): DescriptorsGroup[] {
    const groups: DescriptorsGroup[] = [];

    const currencyCode = stock.currencyInformation.nominal ?? stock.currencyInformation.settlement ?? 'RUB';

    if (stock.mainIndicators != null) {
      groups.push({
        title: translator(['groupTitles', 'mainIndicators']),
        items: this.getMainIndicatorsDescriptors(stock.mainIndicators, currencyCode)
      });
    }

    if (stock.costEstimate != null) {
      groups.push({
        title: translator(['groupTitles', 'costEstimate']),
        items: this.getCostEstimateDescriptors(stock.costEstimate)
      });
    }

    if (stock.profitability != null) {
      groups.push({
        title: translator(['groupTitles', 'profitability']),
        items: this.getProfitabilityDescriptors(stock.profitability)
      });
    }

    if (stock.dividendsAggregateInfo != null) {
      groups.push({
        title: translator(['groupTitles', 'dividends']),
        items: this.getDividendsAggregateInfoDescriptors(stock.dividendsAggregateInfo, currencyCode)
      });
    }

    if (stock.trading != null) {
      groups.push({
        title: translator(['groupTitles', 'trading']),
        items: this.getTradingDescriptors(stock.trading)
      });
    }

    return groups;
  }

  private getMainIndicatorsDescriptors(mainIndicators: MainIndicators, currencyCode: string): Descriptor[] {
    return [
      {
        id: 'EBITDA',
        formattedValue: this.formatCurrency(mainIndicators.ebitda, currencyCode)
      },
      {
        id: 'capitalization',
        formattedValue: this.formatCurrency(mainIndicators.marketCap, currencyCode)
      },
    ];
  }

  private getCostEstimateDescriptors(costEstimate: CostEstimate): Descriptor[] {
    return [
      {
        id: 'priceToEarnings',
        formattedValue: formatNumber(costEstimate.priceToEarnings, this.locale)
      },
      {
        id: 'pricePerShare',
        formattedValue: formatNumber(costEstimate.pricePerShare, this.locale)
      },
      {
        id: 'dilutedEarningsPerShare',
        formattedValue: formatNumber(costEstimate.dilutedEarningsPerShare, this.locale)
      },
    ];
  }

  private getProfitabilityDescriptors(profitability: Profitability): Descriptor[] {
    return [
      {
        id: 'returnOnEquity',
        formattedValue: formatPercent(profitability.returnOnEquity, this.locale, '0.1-2')
      },
      {
        id: 'returnOnAssets',
        formattedValue: formatNumber(profitability.returnOnAssets, this.locale)
      },
      {
        id: 'debtPerEquity',
        formattedValue: formatNumber(profitability.debtPerEquity, this.locale)
      },
    ];
  }

  private getDividendsAggregateInfoDescriptors(dividendsAggregateInfo: DividendsAggregateInfo, currencyCode: string): Descriptor[] {
    return [
      {
        id: 'payoutRatio',
        formattedValue: formatPercent(dividendsAggregateInfo.payoutRatio, this.locale, '0.1-2')
      },
      {
        id: 'averageDividendFor5years',
        formattedValue: this.formatCurrency(dividendsAggregateInfo.averageDividendFor5years, currencyCode)
      },
    ];
  }

  private getTradingDescriptors(trading: Trading): Descriptor[] {
    return [
      {
        id: 'closePrice',
        formattedValue: formatNumber(trading.closePrice, this.locale)
      },
      {
        id: 'maxFor52Weeks',
        formattedValue: formatNumber(trading.maxFor52Weeks, this.locale)
      },
      {
        id: 'minFor52Weeks',
        formattedValue: formatNumber(trading.minFor52Weeks, this.locale)
      },
      {
        id: 'averageTurnoverPerDay',
        formattedValue: formatNumber(trading.averageTurnoverPerDay, this.locale)
      },
      {
        id: 'averageTurnoverPerMonth',
        formattedValue: formatNumber(trading.averageTurnoverPerMonth, this.locale)
      },
    ];
  }

  private formatCurrency(value: number, currencyCode: string): string {
    return this.currencyPipe.transform(value, currencyCode, 'symbol-narrow', '0.1-2', this.locale) ?? '';
  }
}

