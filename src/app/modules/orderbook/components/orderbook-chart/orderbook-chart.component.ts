import {ChangeDetectionStrategy, Component, DestroyRef, inject, input, model, OnInit, viewChild} from '@angular/core';
import {ChartDataset, ChartOptions, ComplexFillTarget, ScatterControllerDatasetOptions} from 'chart.js';
import {MathHelper} from 'src/app/shared/utils/math-helper';
import {ChartData, ChartPoint} from '../../models/orderbook.model';
import {BaseChartDirective} from 'ng2-charts';
import {ThemeService} from '../../../../shared/services/theme.service';
import {TranslatorService} from "../../../../shared/services/translator.service";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-orderbook-chart',
  templateUrl: './orderbook-chart.component.html',
  styleUrls: ['./orderbook-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseChartDirective
  ]
})
export class OrderbookChartComponent implements OnInit {
  readonly chartData = input.required<ChartData>();

  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Объем: ${context.parsed.y}; Цена: ${context.parsed.x}`;
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
                return MathHelper.round(value / 1000000, 1).toString() + 'M';
              } else if (value >= 1000) {
                return MathHelper.round(value / 1000, 1).toString() + 'k';
              } else {
                return value;
              }
            } else {
              return value;
            }
          },
        },
      },
    },
  };

  protected readonly datasets = model<ChartDataset[]>([]);

  private readonly chart = viewChild(BaseChartDirective);

  private readonly themeService = inject(ThemeService);

  private readonly translatorService = inject(TranslatorService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly chartDataChanges$ = toObservable(this.chartData);

  private readonly initialData: ChartDataset[] = [
    {
      fill: {
        target: 'origin'
      } as ComplexFillTarget,
      showLine: true,
      radius: 1,
      borderWidth: 1,
      data: [],
      label: 'Bids',
    },
    {
      fill: {
        target: 'origin'
      } as ComplexFillTarget,
      radius: 1,
      borderWidth: 1,
      showLine: true,
      data: [],
      label: 'Offers',
    },
  ];

  ngOnInit(): void {
    this.themeService.getThemeSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(theme => {
      const buyDatasetOptions = this.initialData[0] as ScatterControllerDatasetOptions;
      (buyDatasetOptions.fill as ComplexFillTarget).above = theme.themeColors.buyColorBackground;
      buyDatasetOptions.borderColor = theme.themeColors.buyColor;
      buyDatasetOptions.pointBackgroundColor = theme.themeColors.buyColorBackground;

      const sellDatasetOptions = this.initialData[1] as ScatterControllerDatasetOptions;
      (sellDatasetOptions.fill as ComplexFillTarget).above = theme.themeColors.sellColorBackground;
      sellDatasetOptions.borderColor = theme.themeColors.sellColor;
      sellDatasetOptions.pointBackgroundColor = theme.themeColors.sellColorBackground;

      this.chartOptions.scales!.x!.ticks!.color = theme.themeColors.chartLabelsColor;
      this.chartOptions.scales!.y!.ticks!.color = theme.themeColors.chartLabelsColor;
    });

    this.translatorService.getTranslator('orderbook/orderbook')
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(t => {
        this.chartOptions.plugins!.tooltip!.callbacks!.label = (context: any): string => {
          return `${t(['volume'])}: ${context.parsed.y}; ${t(['price'])}: ${context.parsed.x}`;
        };
      });

    this.chartDataChanges$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(chartData => {
      this.updateChart(chartData);
    });
  }

  updateChart(chartData: ChartData): void {
    const bids = chartData.bids as ChartPoint[];
    const asks = chartData.asks as ChartPoint[];

    this.initialData[0].data = bids;
    this.initialData[1].data = asks;
    this.datasets.set(this.initialData);

    const x = this.chartOptions.scales?.x;
    if (x) {
      const xBids = bids.map(x => x.x);
      const xAsks = asks.map(x => x.x);

      let minPrice = xBids.length > 0 ? Math.min(...xBids) : null;
      let maxPrice = xAsks.length > 0 ? Math.max(...xAsks) : null;

      if (minPrice == null && maxPrice != null) {
        const minAsk = Math.min(...xAsks);
        minPrice = minAsk - (maxPrice - minAsk);
      }

      if (maxPrice == null && minPrice != null) {
        const maxBid = Math.max(...xBids);
        maxPrice = maxBid + (maxBid - minPrice);
      }

      if (maxPrice != null) {
        x.max = maxPrice;
      }

      if (minPrice != null) {
        x.min = minPrice;
      }
    }
    this.chart()?.render();
  }
}
