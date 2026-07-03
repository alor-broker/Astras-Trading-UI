import {
  ChangeDetectionStrategy,
  Component,
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
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {SignalDirection} from '../../services/ai-signals-service.types';
import {AnalystViewModel} from '../../types/ai-signals-view.types';

interface ChartSettings {
  chartData: ChartData<'bar', (number | null)[]>;
  chartOptions: ChartOptions<'bar'>;
}

@Component({
  selector: 'ats-analysts-chart',
  imports: [
    BaseChartDirective
  ],
  templateUrl: './analysts-chart.html',
  styleUrl: './analysts-chart.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalystsChart {
  readonly analysts = input.required<AnalystViewModel[]>();

  protected readonly chartSettings = signal<ChartSettings | null>(null);

  private readonly themeService = inject(ThemeService);

  private readonly translatorService = inject(TranslatorService);

  constructor() {
    combineLatest({
      analysts: toObservable(this.analysts),
      themeColors: this.themeService.getThemeSettings().pipe(
        map(settings => settings.themeColors)
      ),
      translator: this.translatorService.getTranslator('ai-signals')
    }).pipe(
      takeUntilDestroyed()
    ).subscribe(x => {
      this.chartSettings.set(this.createChartSettings(x.analysts, x.themeColors, x.translator));
    });
  }

  private createChartSettings(
    allAnalysts: AnalystViewModel[],
    themeColors: ThemeColors,
    translator: TranslatorFn
  ): ChartSettings | null {
    const analysts = allAnalysts.filter(analyst => analyst.confidence != null);

    if (analysts.length === 0) {
      return null;
    }

    return {
      chartData: {
        labels: analysts.map(analyst => this.truncateModelName(analyst.modelName)),
        datasets: [
          {
            type: 'bar',
            data: analysts.map(analyst => analyst.confidence),
            backgroundColor: analysts.map(analyst => this.getDirectionColor(analyst.direction, themeColors)),
            borderWidth: 0,
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.6
          }
        ]
      },
      chartOptions: this.createChartOptions(analysts, themeColors, translator)
    };
  }

  private createChartOptions(
    analysts: AnalystViewModel[],
    themeColors: ThemeColors,
    translator: TranslatorFn
  ): ChartOptions<'bar'> {
    return {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {display: false},
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (tooltipItems: TooltipItem<'bar'>[]): string => analysts[tooltipItems[0].dataIndex].modelName,
            label: (tooltipItem: TooltipItem<'bar'>): string => this.getTooltipLabel(analysts[tooltipItem.dataIndex], translator)
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: themeColors.chartLabelsColor
          }
        },
        y: {
          min: 0,
          max: 10,
          grid: {
            color: themeColors.chartGridColor
          },
          ticks: {
            color: themeColors.chartLabelsColor,
            stepSize: 2
          }
        }
      }
    };
  }

  private getTooltipLabel(analyst: AnalystViewModel, translator: TranslatorFn): string {
    const labelParts = [`${analyst.confidence}/10`];

    if (analyst.direction != null) {
      labelParts.push(translator(['directions', analyst.direction]));
    }

    if (analyst.action != null) {
      labelParts.push(translator(['actions', analyst.action]));
    }

    return labelParts.join(' | ');
  }

  private getDirectionColor(direction: SignalDirection | null, themeColors: ThemeColors): string {
    switch (direction) {
      case SignalDirection.Bullish:
        return themeColors.buyColor;
      case SignalDirection.Bearish:
        return themeColors.sellColor;
      default:
        return themeColors.mixColor;
    }
  }

  private truncateModelName(modelName: string): string {
    const maxLength = 12;
    // model names look like "google/gemini-pro"; the part after the vendor prefix is the most meaningful
    const shortName = modelName.split('/').pop() ?? modelName;

    return shortName.length > maxLength
      ? `${shortName.substring(0, maxLength)}…`
      : shortName;
  }
}
