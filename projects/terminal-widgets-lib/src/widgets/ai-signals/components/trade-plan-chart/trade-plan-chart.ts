import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable
} from '@angular/core/rxjs-interop';
import {
  combineLatest,
  map
} from 'rxjs';
import {
  ChartData,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {TranslocoDirective} from '@jsverse/transloco';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {TradePlanViewModel} from '../../types/ai-signals-view.types';

interface ChartSettings {
  chartData: ChartData<'bar', ([number, number] | null)[]>;
  chartOptions: ChartOptions<'bar'>;
}

interface PriceLevel {
  labelKey: string;
  value: number;
  isReferenceLine: boolean;
  getColor: (themeColors: ThemeColors) => string;
}

@Component({
  selector: 'ats-trade-plan-chart',
  imports: [
    TranslocoDirective,
    BaseChartDirective,
    AtsPrice
  ],
  templateUrl: './trade-plan-chart.html',
  styleUrl: './trade-plan-chart.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradePlanChart {
  readonly plan = input.required<TradePlanViewModel>();

  readonly currentPrice = input<number | null>(null);

  protected readonly chartSettings = signal<ChartSettings | null>(null);

  protected readonly levelRows = computed(() => {
    const plan = this.plan();

    return [
      {labelKey: 'entryPrice', value: plan.entryPrice},
      {labelKey: 'stopLoss', value: plan.stopLoss},
      {labelKey: 'takeProfit1', value: plan.takeProfit1},
      {labelKey: 'takeProfit2', value: plan.takeProfit2}
    ].filter(row => row.value != null);
  });

  private readonly themeService = inject(ThemeService);

  private readonly translatorService = inject(TranslatorService);

  constructor() {
    combineLatest({
      plan: toObservable(this.plan),
      currentPrice: toObservable(this.currentPrice),
      themeColors: this.themeService.getThemeSettings().pipe(
        map(settings => settings.themeColors)
      ),
      translator: this.translatorService.getTranslator('ai-signals/trade-plan-chart')
    }).pipe(
      takeUntilDestroyed()
    ).subscribe(x => {
      this.chartSettings.set(this.createChartSettings(x.plan, x.currentPrice, x.themeColors, x.translator));
    });
  }

  private createChartSettings(
    plan: TradePlanViewModel,
    currentPrice: number | null,
    themeColors: ThemeColors,
    translator: TranslatorFn
  ): ChartSettings | null {
    const levels = this.getPriceLevels(plan, currentPrice);
    const entryPrice = plan.entryPrice;

    if (entryPrice == null || levels.length < 2) {
      return null;
    }

    const values = levels.map(level => level.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = range > 0 ? range * 0.03 : Math.abs(maxValue) * 0.01;
    const referenceLineWidth = range > 0 ? range * 0.005 : Math.abs(maxValue) * 0.002;

    return {
      chartData: {
        labels: levels.map(level => translator([level.labelKey])),
        datasets: [
          {
            type: 'bar',
            data: levels.map(level => level.isReferenceLine
              ? [level.value - referenceLineWidth, level.value + referenceLineWidth]
              : [Math.min(entryPrice, level.value), Math.max(entryPrice, level.value)]
            ),
            backgroundColor: levels.map(level => level.getColor(themeColors)),
            borderWidth: 0,
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.7
          }
        ]
      },
      chartOptions: this.createChartOptions(minValue - padding, maxValue + padding, levels, themeColors)
    };
  }

  private createChartOptions(
    axisMin: number,
    axisMax: number,
    levels: PriceLevel[],
    themeColors: ThemeColors
  ): ChartOptions<'bar'> {
    return {
      indexAxis: 'y',
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {display: false},
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (tooltipItem: TooltipItem<'bar'>): string => this.getTooltipLabel(tooltipItem, levels)
          }
        }
      },
      scales: {
        x: {
          min: axisMin,
          max: axisMax,
          grid: {
            color: themeColors.chartGridColor
          },
          ticks: {
            color: themeColors.chartLabelsColor,
            maxTicksLimit: 6
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: themeColors.chartLabelsColor
          }
        }
      }
    };
  }

  private getTooltipLabel(tooltipItem: TooltipItem<'bar'>, levels: PriceLevel[]): string {
    const level = levels[tooltipItem.dataIndex];
    const currentPrice = this.currentPrice();

    if (currentPrice == null || currentPrice === 0 || level.labelKey === 'currentPrice') {
      return `${level.value}`;
    }

    const changePercent = MathHelper.round(((level.value - currentPrice) / currentPrice) * 100, 2);
    const sign = changePercent > 0 ? '+' : '';

    return `${level.value} (${sign}${changePercent}%)`;
  }

  private getPriceLevels(plan: TradePlanViewModel, currentPrice: number | null): PriceLevel[] {
    const levels: {labelKey: string, value: number | null, isReferenceLine: boolean, getColor: (themeColors: ThemeColors) => string}[] = [
      {
        labelKey: 'takeProfit2',
        value: plan.takeProfit2,
        isReferenceLine: false,
        getColor: (themeColors): string => themeColors.buyColorBackground
      },
      {
        labelKey: 'takeProfit1',
        value: plan.takeProfit1,
        isReferenceLine: false,
        getColor: (themeColors): string => themeColors.buyColor
      },
      {
        labelKey: 'entryPrice',
        value: plan.entryPrice,
        isReferenceLine: true,
        getColor: (themeColors): string => themeColors.primaryColor
      },
      {
        labelKey: 'currentPrice',
        // zero is not a meaningful market price and would stretch the axis to zero
        value: currentPrice != null && currentPrice > 0 ? currentPrice : null,
        isReferenceLine: true,
        getColor: (themeColors): string => themeColors.textColor
      },
      {
        labelKey: 'stopLoss',
        value: plan.stopLoss,
        isReferenceLine: false,
        getColor: (themeColors): string => themeColors.sellColor
      }
    ];

    return levels.filter((level): level is PriceLevel => level.value != null);
  }
}
