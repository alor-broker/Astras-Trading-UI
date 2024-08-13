import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartDataset, ChartType } from 'chart.js';
import { DataOverTime, Finance } from '../../../models/finance.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { ThemeService } from '../../../../../shared/services/theme.service';
import { ThemeSettings } from '../../../../../shared/models/settings/theme-settings.model';
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../../shared/services/translator.service";
import { HashMap } from "@jsverse/transloco/lib/types";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-finance-bar-chart',
  templateUrl: './finance-bar-chart.component.html',
  styleUrls: ['./finance-bar-chart.component.less']
})
export class FinanceBarChartComponent implements OnInit {
  @Input({required: true})
  finance!: Finance;

  public yearChartOptions: ChartConfiguration['options'] = {
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
              }
              else if (value >= Math.pow(10, 6)) {
                return MathHelper.round(value / Math.pow(10, 6), 1).toString() + 'M';
              }
              else if (value >= Math.pow(10, 3)) {
                return MathHelper.round(value / Math.pow(10, 3), 1).toString() + 'k';
              }
              else {
                return value;
              }
            }
            else return value;
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

  quorterChartOptions: ChartConfiguration['options'] = {
    ...this.yearChartOptions,
    plugins: {
      legend: {
        display: false,
      }
    }
  };

  public barChartType: ChartType = 'bar';

  public yearChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public quorterChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  constructor(
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.themeService.getThemeSettings().pipe(
      mapWith(
        () => this.translatorService.getTranslator('info/finance'),
        (theme, translate) => ({ theme, translate })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ theme, translate }) => {
      this.yearChartData = this.getPlotData('year', theme, translate);
      this.quorterChartData = this.getPlotData('quarter', theme, translate);
    });
  }

  private getPlotData(period: 'year' | 'quarter', theme: ThemeSettings, t: (key: string[], params?: HashMap) => string): ChartData<'bar'> {
    let labels: string[] = [];
    const datasets: ChartDataset<'bar'>[] = [];
    if ((this.finance.sales as DataOverTime | undefined | null) != null) {
      labels = period == 'quarter' ?
        this.finance.sales.quarter.map(q => `${q.year} q${q.quarter}`) as string[] :
        this.finance.sales[period].map(y => y.year.toString()) as string[];

      datasets.push(
        {
          data: this.finance.sales[period].map(y => y.value) as number[],
          label: t(['salesLabel']),
          ...this.getSalesColors(theme)
        } as ChartDataset<'bar'>
      );
    }

    if ((this.finance.netIncome as DataOverTime | undefined | null) != null) {
      datasets.push(
        {
          data: this.finance.netIncome[period].map(y => y.value) as number[],
          label: t(['incomeLabel']),
          ...this.getIncomeColors(theme)
        } as ChartDataset<'bar'>
      );
    }

    return {
      labels,
      datasets
    };
  }

  private getSalesColors(theme: ThemeSettings): { backgroundColor: string, hoverBackgroundColor: string, borderColor: string } {
    return {
      backgroundColor: theme.themeColors.primaryColor,
      hoverBackgroundColor: theme.themeColors.errorColor,
      borderColor: theme.themeColors.primaryColor
    };
  }

  private getIncomeColors(theme: ThemeSettings): { backgroundColor: string, hoverBackgroundColor: string, borderColor: string } {
    return {
      backgroundColor: theme.themeColors.purpleColor,
      hoverBackgroundColor: theme.themeColors.errorColor,
      borderColor: theme.themeColors.purpleColor
    };
  }
}
