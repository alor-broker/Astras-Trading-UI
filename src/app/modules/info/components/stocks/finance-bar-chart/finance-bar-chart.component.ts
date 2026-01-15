import { Component, DestroyRef, input, OnInit, inject } from '@angular/core';
import {ChartConfiguration, ChartData, ChartDataset, ChartType} from 'chart.js';
import {MathHelper} from 'src/app/shared/utils/math-helper';
import {ThemeService} from '../../../../../shared/services/theme.service';
import {ThemeSettings} from '../../../../../shared/models/settings/theme-settings.model';
import {TranslatorFn, TranslatorService} from "../../../../../shared/services/translator.service";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {Stock} from "../../../../../../generated/graphql.types";
import {BaseChartDirective} from "ng2-charts";
import {combineLatest} from "rxjs";
import {filter} from "rxjs/operators";

@Component({
  selector: 'ats-finance-bar-chart',
  templateUrl: './finance-bar-chart.component.html',
  styleUrls: ['./finance-bar-chart.component.less'],
  imports: [
    BaseChartDirective
  ]
})
export class FinanceBarChartComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly translatorService = inject(TranslatorService);
  private readonly destroyRef = inject(DestroyRef);

  yearChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          font: {
            size: 8
          }
        }
      },
      y: {
        ticks: {
          callback: (value) => {
            if (typeof value === 'number') {
              if (value >= Math.pow(10, 9)) {
                return MathHelper.round(value / Math.pow(10, 9), 1).toString() + 'B';
              } else if (value >= Math.pow(10, 6)) {
                return MathHelper.round(value / Math.pow(10, 6), 1).toString() + 'M';
              } else if (value >= Math.pow(10, 3)) {
                return MathHelper.round(value / Math.pow(10, 3), 1).toString() + 'k';
              } else {
                return value;
              }
            } else return value;
          },
        },
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };

  quarterChartOptions: ChartConfiguration['options'] = {
    ...this.yearChartOptions,
    plugins: {
      legend: {
        display: false,
      }
    }
  };

  barChartType: ChartType = 'bar';
  yearChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  quarterChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  readonly stockInfo = input.required<Stock>();
  private readonly stockInfoChanges$ = toObservable(this.stockInfo);

  ngOnInit(): void {
    combineLatest({
      theme: this.themeService.getThemeSettings(),
      stockInfo: this.stockInfoChanges$,
      translator: this.translatorService.getTranslator('info/finance')
    }).pipe(
      filter(x => x.stockInfo != null),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.yearChartData = this.getYearPlotData(x.stockInfo!, x.theme, x.translator);
      this.quarterChartData = this.getQuarterPlotData(x.stockInfo!, x.theme, x.translator);
    });
  }

  private getQuarterPlotData(
    stock: Stock,
    theme: ThemeSettings,
    translator: TranslatorFn
  ): ChartData<'bar'> {
    let labels: string[] = [];
    const datasets: ChartDataset<'bar'>[] = [];

    if (stock.sales?.quarter != null) {
      labels = stock.sales.quarter.map(q => `${q.year} q${q.quarter}`);
      datasets.push(
        {
          data: stock.sales.quarter.map(y => y.value),
          label: translator(['salesLabel']),
          ...this.getSalesColors(theme)
        } as ChartDataset<'bar'>
      );
    }

    return {
      labels,
      datasets
    };
  }

  private getYearPlotData(
    stock: Stock,
    theme: ThemeSettings,
    translator: TranslatorFn
  ): ChartData<'bar'> {
    let labels: string[] = [];
    const datasets: ChartDataset<'bar'>[] = [];

    if (stock.sales?.year != null) {
      labels = stock.sales.year.map(y => y.year.toString());
      datasets.push(
        {
          data: stock.sales.year.map(y => y.value),
          label: translator(['salesLabel']),
          ...this.getSalesColors(theme)
        } as ChartDataset<'bar'>
      );
    }

    if (stock.netIncome?.year != null) {
      datasets.push(
        {
          data: stock.netIncome.year.map(y => y.value),
          label: translator(['incomeLabel']),
          ...this.getIncomeColors(theme)
        } as ChartDataset<'bar'>
      );
    }

    return {
      labels,
      datasets
    };
  }

  private getSalesColors(theme: ThemeSettings): {
    backgroundColor: string;
    hoverBackgroundColor: string;
    borderColor: string;
  } {
    return {
      backgroundColor: theme.themeColors.primaryColor,
      hoverBackgroundColor: theme.themeColors.errorColor,
      borderColor: theme.themeColors.primaryColor
    };
  }

  private getIncomeColors(theme: ThemeSettings): {
    backgroundColor: string;
    hoverBackgroundColor: string;
    borderColor: string;
  } {
    return {
      backgroundColor: theme.themeColors.purpleColor,
      hoverBackgroundColor: theme.themeColors.errorColor,
      borderColor: theme.themeColors.purpleColor
    };
  }
}
