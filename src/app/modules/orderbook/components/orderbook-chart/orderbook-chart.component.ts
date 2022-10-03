import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  map,
  Observable,
  Subject,
  takeUntil
} from 'rxjs';
import {
  ChartDataset,
  ChartOptions,
  ComplexFillTarget,
  ScatterControllerDatasetOptions
} from 'chart.js';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { ChartData } from '../../models/orderbook.model';
import { BaseChartDirective } from 'ng2-charts';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookSettings } from "../../../../shared/models/settings/orderbook-settings.model";
import { ThemeService } from '../../../../shared/services/theme.service';

@Component({
  selector: 'ats-orderbook-chart[guid][chartData]',
  templateUrl: './orderbook-chart.component.html',
  styleUrls: ['./orderbook-chart.component.less'],
})
export class OrderbookChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  chartData!: ChartData;
  @Input()
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
              }
              else if (value >= 1000) {
                return MathHelper.round(value / 1000, 1) + 'k';
              }
              else {
                return value;
              }
            }
            else {
              return value;
            }
          },
        },
      },
    },
  };
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private initialData: ChartDataset[] = [
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
    private readonly themeService: ThemeService) {
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit() {
    this.shouldShowChart$ = this.widgetSettings.getSettings<OrderbookSettings>(this.guid).pipe(
      map((s) => s.showChart)
    );

    this.themeService.getThemeSettings().pipe(
      takeUntil(this.destroy$)
    ).subscribe(theme => {
      const buyDatasetOptions = this.initialData[0] as ScatterControllerDatasetOptions;
      (buyDatasetOptions.fill as ComplexFillTarget).above = theme.themeColors.buyColorBackground;
      buyDatasetOptions.borderColor = theme.themeColors.buyColor;
      buyDatasetOptions.pointBackgroundColor = theme.themeColors.buyColorBackground;

      const sellDatasetOptions = this.initialData[1] as ScatterControllerDatasetOptions;
      (sellDatasetOptions.fill as ComplexFillTarget).above = theme.themeColors.sellColorBackground;
      sellDatasetOptions.borderColor = theme.themeColors.sellColor;
      sellDatasetOptions.pointBackgroundColor = theme.themeColors.sellColorBackground;
    });
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
