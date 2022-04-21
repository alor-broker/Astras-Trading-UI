import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';
import { ChartDataset, ChartOptions } from 'chart.js';
import { buyColorBackground, sellColorBackground, buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { ChartData } from '../../models/orderbook.model';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'ats-orderbook-chart[guid][chartData]',
  templateUrl: './orderbook-chart.component.html',
  styleUrls: ['./orderbook-chart.component.less'],
})
export class OrderbookChartComponent implements OnInit, OnChanges {
  @Input()
  chartData!: ChartData;
  @Input()
  guid!: string;

  @ViewChild(BaseChartDirective)
  chart?: BaseChartDirective;

  shouldShowChart$?: Observable<boolean>;
  chartData$ = new BehaviorSubject<ChartDataset[]>([]);
  public initialData: ChartDataset[] = [
    {
      fill: {
        target: 'origin',
        above: buyColorBackground, // Area will be red above the origin
      },
      showLine: true,
      radius: 1,
      borderWidth: 1,
      borderColor: buyColor,
      pointBackgroundColor: buyColorBackground,
      data: [],
      label: 'Bids',
    },
    {
      fill: {
        target: 'origin',
        above: sellColorBackground, // Area will be red above the origin
      },
      radius: 1,
      borderWidth: 1,
      borderColor: sellColor,
      pointBackgroundColor: sellColorBackground,
      showLine: true,
      data: [],
      label: 'Offers',
    },
  ];
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Объем: ${context.formattedValue}; Цена: ${context.label}`;
          }
        }
      }
    },
    scales: {
      x: {
        // display: false, //this will remove all the x-axis grid lines
        // position: 'top',
        ticks: {
          font: {
            size: 8
          }
        },
      },
      y: {
        ticks: {
          callback: (value) => {
            if (typeof value === 'number') {
              if (value >= 1000000) {
                return MathHelper.round(value / 1000000, 1) + 'M';
              } else if (value >= 1000) {
                return MathHelper.round(value / 1000, 1) + 'k';
              } else {
                return value;
              }
            } else return value;
          },
        },
      },
    },
  };

  constructor(private service: OrderbookService) {}

  ngOnInit() {
    this.shouldShowChart$ = this.service
      .getSettings(this.guid)
      .pipe(map((s) => s.showChart));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initialData[0].data = changes.chartData.currentValue.bids;
    this.initialData[1].data = changes.chartData.currentValue.asks;
    this.chartData$?.next(this.initialData);
    const x = this.chartOptions.scales?.x;
    if (x) {
      x.max = changes.chartData.currentValue.maxPrice;
      x.min = changes.chartData.currentValue.minPrice;
    }
    this.chart?.render();
  }
}
