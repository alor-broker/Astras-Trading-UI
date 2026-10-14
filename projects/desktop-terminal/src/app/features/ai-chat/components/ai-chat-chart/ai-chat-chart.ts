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
import {TranslocoDirective} from '@jsverse/transloco';
import {
  ChartData,
  ChartOptions
} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {NzAlertModule} from 'ng-zorro-antd/alert';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {
  AiChatChartDefinition,
  AiChatChartType
} from '../../ai-chat-chart.types';

@Component({
  selector: 'atsd-ai-chat-chart',
  imports: [BaseChartDirective, TranslocoDirective, NzAlertModule],
  templateUrl: './ai-chat-chart.html',
  styleUrl: './ai-chat-chart.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChatChart {
  readonly definition = input.required<AiChatChartDefinition | null>();

  private readonly theme = toSignal(inject(ThemeService).getThemeSettings());

  private readonly locale = inject(LOCALE_ID);

  protected readonly chartSettings = computed(() => {
    const definition = this.definition();
    const theme = this.theme();
    if (definition == null || theme == null) {
      return null;
    }

    const colors = theme.themeColors;
    const palette = [colors.primaryColor, colors.purpleColor, colors.buyColor, colors.sellColor, colors.mixColor];
    const isCircular = definition.type === AiChatChartType.Pie || definition.type === AiChatChartType.Doughnut;
    const data: ChartData<AiChatChartType, (number | null)[], string> = {
      labels: [...definition.data.labels],
      datasets: definition.data.series.map((series, index) => ({
        label: series.name,
        data: [...series.values],
        backgroundColor: isCircular
          ? definition.data.labels.map((label, labelIndex) => palette[labelIndex % palette.length])
          : palette[index % palette.length],
        borderColor: isCircular ? colors.componentBackground : palette[index % palette.length],
        borderWidth: 2,
        spanGaps: false,
        tension: 0,
        pointRadius: 2,
        pointHitRadius: 8
      }))
    };
    const options: ChartOptions<AiChatChartType> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      locale: this.locale,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {color: colors.chartLabelsColor, boxWidth: 12}
        },
        tooltip: {enabled: true}
      }
    };
    if (!isCircular) {
      options.scales = {
        x: {
          grid: {display: false},
          ticks: {color: colors.chartLabelsColor, maxRotation: 0}
        },
        y: {
          beginAtZero: definition.type === AiChatChartType.Bar,
          grid: {color: colors.chartGridColor},
          ticks: {color: colors.chartLabelsColor}
        }
      };
    }

    return {data, options};
  });
}
