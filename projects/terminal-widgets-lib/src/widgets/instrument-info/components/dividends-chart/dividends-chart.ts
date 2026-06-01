import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  signal,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {Dividend} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.types";
import {ThemeService} from "@terminal-core-lib/features/themes/services/theme.service";
import {
  combineLatest,
  map,
  shareReplay,
  take
} from "rxjs";
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {TranslatorFn} from "@terminal-core-lib/features/translations/services/translator-service.types";
import {format} from 'date-fns';
import {
  enUS,
  ru
} from "date-fns/locale";
import {
  ChartData,
  ChartOptions
} from 'chart.js';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {BaseChartDirective} from 'ng2-charts';

interface ChartSettings {
  chartData: ChartData<'bar' | 'line', (number | null)[]>;
  chartOptions: ChartOptions<'bar' | 'line'>;
}

@Component({
  selector: 'ats-dividends-chart',
  imports: [
    NzEmptyComponent,
    BaseChartDirective
  ],
  templateUrl: './dividends-chart.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividendsChart implements OnChanges {
  readonly dividends = input<Dividend[]>([]);

  protected readonly chartSettings = signal<ChartSettings | null>(null);

  private readonly themeService = inject(ThemeService);

  private readonly translatorService = inject(TranslatorService);

  private readonly themeColors$ = this.themeService.getThemeSettings().pipe(
    map(s => s.themeColors),
    shareReplay(1)
  );

  private readonly translator$ = this.translatorService.getTranslator('info/dividends')
    .pipe(
      shareReplay(1)
    );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dividends != null) {
      this.updateChartSettings();
    }
  }

  private getChartData(
    dividends: Dividend[],
    themeColors: ThemeColors,
    translator: TranslatorFn
  ): ChartSettings['chartData'] {
    if (dividends.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const values = dividends.map((dividend: Dividend) => ({
      eventDate: new Date(dividend.recommendFixDate ?? dividend.recordDate),
      dividendPerShare: dividend.dividendPerShare,
      dividendYield: dividend.dividendYield * 100,
    }))
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    return {
      labels: values.map(d => d.eventDate),
      datasets: [
        {
          type: 'bar',
          label: translator(['dividendPerShare'], {fallback: 'Dividend per share'}),
          data: values.map(d => d.dividendPerShare),
          yAxisID: 'y',
          backgroundColor: themeColors.buyColorBackground,
          borderColor: themeColors.buyColorAccent,
          borderWidth: 2,
          borderRadius: 3,
          borderSkipped: false,
        },
        {
          type: 'line',
          label: translator(['dividendYield'], {fallback: 'Dividend yield'}),
          data: values.map(d => d.dividendYield),
          borderColor: themeColors.primaryColor,
          pointBackgroundColor: themeColors.primaryColor,
          yAxisID: 'y1'
        }
      ]
    };
  }

  private updateChartSettings(): void {
    combineLatest({
        themeColors: this.themeColors$,
        lang: this.translatorService.getLangChanges(),
        translator: this.translator$
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
      this.chartSettings.set({
        chartOptions: this.getChartOptions(x.lang),
        chartData: this.getChartData(this.dividends(), x.themeColors, x.translator)
      });
    });
  }

  private getChartOptions(lang: string): ChartSettings['chartOptions'] {
    return {
      maintainAspectRatio: false,
      responsive: true,
      locale: lang,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {display: false},
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (tooltipItems): string => {
              return format(
                new Date(tooltipItems[0].parsed.x as unknown as string),
                'd MMM yyyy',
                {
                  locale: this.getDateLocale(lang)
                }
              );
            },
            label: (tooltipItem): string => {
              const label = tooltipItem.dataset.label ?? '';
              const value = tooltipItem.formattedValue;

              if (tooltipItem.dataset.yAxisID === 'y1') {
                return `${label}: ${value} %`;
              }

              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          offset: true,
          adapters: {
            date: {
              locale: this.getDateLocale(lang)
            }
          },
          ticks: {
            source: 'data',
            autoSkip: true,
            align: 'center',
            minRotation: 30,
            maxRotation: 30
          }
        },
        y: {
          position: 'right',
          beginAtZero: true,
          title: {
            display: false,
          },
        },
        y1: {
          position: 'left',
          beginAtZero: true,
          title: {
            display: false,
          },
          ticks: {
            callback: (value): string => `${Number(value).toFixed(2)} %`
          }
        }
      }
    };
  }

  private getDateLocale(lang: string): Locale {
    return lang === 'ru' ? ru : enUS;
  }
}
