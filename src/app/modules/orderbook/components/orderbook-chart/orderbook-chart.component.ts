import {Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {BehaviorSubject, map, Observable,} from 'rxjs';
import {ChartDataset, ChartOptions, ComplexFillTarget, ScatterControllerDatasetOptions} from 'chart.js';
import {MathHelper} from 'src/app/shared/utils/math-helper';
import {ChartData, ChartPoint} from '../../models/orderbook.model';
import {BaseChartDirective} from 'ng2-charts';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ThemeService} from '../../../../shared/services/theme.service';
import {OrderbookSettings} from '../../models/orderbook-settings.model';
import {TranslatorService} from "../../../../shared/services/translator.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-orderbook-chart',
  templateUrl: './orderbook-chart.component.html',
  styleUrls: ['./orderbook-chart.component.less'],
  imports: [
    BaseChartDirective,
    AsyncPipe
  ]
})
export class OrderbookChartComponent implements OnInit, OnChanges {
  @Input({required: true})
  chartData!: ChartData;

  @Input({required: true})
  guid!: string;

  @ViewChild(BaseChartDirective)
  chart?: BaseChartDirective;

  shouldShowChart$?: Observable<boolean>;
  chartData$ = new BehaviorSubject<ChartDataset[]>([]);
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

  constructor(
    private readonly widgetSettings: WidgetSettingsService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.shouldShowChart$ = this.widgetSettings.getSettings<OrderbookSettings>(this.guid).pipe(
      map((s) => s.showChart)
    );

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
  }

  ngOnChanges(changes: SimpleChanges): void {
    const bids = changes.chartData.currentValue.bids as ChartPoint[];
    const asks = changes.chartData.currentValue.asks as ChartPoint[];

    this.initialData[0].data = bids;
    this.initialData[1].data = asks;
    this.chartData$.next(this.initialData);

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
    this.chart?.render();
  }
}
