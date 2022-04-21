import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Finance } from '../../../models/finance.model';
import { primaryColor, purpleColor5, errorColor } from 'src/app/shared/models/settings/styles-constants';
import { MathHelper } from 'src/app/shared/utils/math-helper';

@Component({
  selector: 'ats-finance-bar-chart[finance]',
  templateUrl: './finance-bar-chart.component.html',
  styleUrls: ['./finance-bar-chart.component.less']
})
export class FinanceBarChartComponent implements OnInit {
  @Input()
  finance!: Finance;

  private salesColors = {
    backgroundColor: primaryColor, hoverBackgroundColor: errorColor, borderColor: primaryColor
  };

  private incomeColors = {
    backgroundColor: purpleColor5, hoverBackgroundColor: errorColor, borderColor: purpleColor5
  };

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
              } else if (value >= Math.pow(10, 6)) {
                return MathHelper.round(value / Math.pow(10, 6), 1) + 'M';
              } else if (value >= Math.pow(10, 3)) {
                return MathHelper.round(value / Math.pow(10, 3), 1) + 'k';
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

  quorterChartOptions: ChartConfiguration['options'] = {...this.yearChartOptions,
    plugins: {
      legend: {
        display: false,
      }
    }};

  public barChartType: ChartType = 'bar';
  public yearChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public quorterChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  constructor() { }

  ngOnInit(): void {
    this.yearChartData = this.getPlotData(this.finance, 'year');
    this.quorterChartData = this.getPlotData(this.finance, 'quorter');
  }

  private getPlotData(finance: Finance, period: 'year' | 'quorter') {
    let labels: string[] = [];
    if (finance.sales) {
      labels = period == 'quorter' ?
      finance.sales.quorter.map(q => `${q.year} q${q.quorterNumber}`) :
      finance.sales[period].map(y => y.year.toString());
    }
    const datasets = [
      { data: finance?.sales?.[period].map(y => y.value), label: 'Выручка', ...this.salesColors ?? []},
      { data: finance?.netIncome?.[period].map(y => y.value), label: 'Чистая прибыль', ...this.incomeColors ?? []}
    ];
    const chartData = {
      labels,
      datasets
    };
    return chartData;
  }

}
