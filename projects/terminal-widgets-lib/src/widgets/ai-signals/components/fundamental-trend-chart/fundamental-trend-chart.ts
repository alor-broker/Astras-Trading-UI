import {formatNumber} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  ViewEncapsulation
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ChartData, ChartOptions} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {FundamentalTrendPoint} from '../../types/fundamental-view.types';

interface FundamentalChartSettings {
  data: ChartData<'bar', (number | null)[]>;
  options: ChartOptions<'bar'>;
  description: string;
}

@Component({
  selector: 'ats-fundamental-trend-chart',
  imports: [BaseChartDirective],
  templateUrl: './fundamental-trend-chart.html',
  styleUrl: './fundamental-trend-chart.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FundamentalTrendChart {
  readonly points = input.required<FundamentalTrendPoint[]>();

  readonly title = input.required<string>();

  readonly unit = input.required<string>();

  private readonly locale = inject(LOCALE_ID);

  private readonly theme = toSignal(inject(ThemeService).getThemeSettings());

  protected readonly chartSettings = computed<FundamentalChartSettings | null>(() => {
    const theme = this.theme();
    const points = this.points();
    if (theme == null) {
      return null;
    }

    const colors = theme.themeColors;
    const unit = this.unit();
    const title = this.title();
    const numberLabel = (value: number): string => formatNumber(value, this.locale, '1.0-2');

    return {
      data: {
        labels: points.map(point => point.period),
        datasets: [{
          label: title,
          data: points.map(point => point.value),
          backgroundColor: points.map(point => point.value != null && point.value < 0
            ? colors.sellColor
: colors.primaryColor),
          borderRadius: 3,
          maxBarThickness: 38,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {display: false},
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (item): string => item.parsed.y == null ? '' : `${numberLabel(item.parsed.y)} ${unit}`
            }
          }
        },
        scales: {
          x: {
            grid: {display: false},
            ticks: {color: colors.chartLabelsColor, maxRotation: 0, font: {size: 10}}
          },
          y: {
            beginAtZero: true,
            grid: {color: colors.chartGridColor},
            border: {display: false},
            ticks: {color: colors.chartLabelsColor, maxTicksLimit: 4, font: {size: 10}}
          }
        }
      },
      description: `${title}, ${unit}. ${points.flatMap(point => point.value == null
        ? []
: [`${point.period}: ${numberLabel(point.value)}`]).join('; ')}`
    };
  });
}
