import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ChartConfiguration,
  ChartData,
  ChartType
} from 'chart.js';
import { Finance } from '../../../models/finance.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { ThemeService } from '../../../../../shared/services/theme.service';
import {
  Subject,
  takeUntil
} from 'rxjs';
import { ThemeSettings } from '../../../../../shared/models/settings/theme-settings.model';

@Component({
  selector: 'ats-finance-bar-chart[finance]',
  templateUrl: './finance-bar-chart.component.html',
  styleUrls: ['./finance-bar-chart.component.less']
})
export class FinanceBarChartComponent implements OnInit, OnDestroy {
  @Input()
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
                return MathHelper.round(value / Math.pow(10, 9), 1) + 'B';
              }
              else if (value >= Math.pow(10, 6)) {
                return MathHelper.round(value / Math.pow(10, 6), 1) + 'M';
              }
              else if (value >= Math.pow(10, 3)) {
                return MathHelper.round(value / Math.pow(10, 3), 1) + 'k';
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

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly themeService: ThemeService
  ) {
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.themeService.getThemeSettings().pipe(
      takeUntil(this.destroy$)
    ).subscribe(theme => {
      this.yearChartData = this.getPlotData(this.finance, 'year', theme);
      this.quorterChartData = this.getPlotData(this.finance, 'quorter', theme);
    });
  }

  private getPlotData(finance: Finance, period: 'year' | 'quorter', theme: ThemeSettings) {
    let labels: string[] = [];
    if (finance.sales) {
      labels = period == 'quorter' ?
        finance.sales.quorter.map(q => `${q.year} q${q.quorterNumber}`) :
        finance.sales[period].map(y => y.year.toString());
    }
    const datasets = [
      { data: finance?.sales?.[period].map(y => y.value), label: 'Выручка', ...this.getSalesColors(theme) ?? [] },
      {
        data: finance?.netIncome?.[period].map(y => y.value),
        label: 'Чистая прибыль', ...this.getIncomeColors(theme) ?? []
      }
    ];
    const chartData = {
      labels,
      datasets
    };
    return chartData;
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
