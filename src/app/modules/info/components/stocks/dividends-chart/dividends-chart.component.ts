import {
  Component,
  input,
  OnChanges,
  signal,
  SimpleChanges
} from '@angular/core';
import { Dividend } from "../../../../../../generated/graphql.types";
import {
  ChartData,
  ChartOptions
} from "chart.js";
import { ThemeService } from "../../../../../shared/services/theme.service";
import { map } from "rxjs/operators";
import { ThemeColors } from "../../../../../shared/models/settings/theme-settings.model";
import {
  TranslatorFn,
  TranslatorService
} from "../../../../../shared/services/translator.service";
import {
  combineLatest,
  shareReplay,
  take
} from "rxjs";
import { BaseChartDirective } from "ng2-charts";
import {
  enUS,
  ru
} from "date-fns/locale";
import { format } from "date-fns";
import { NzEmptyComponent } from "ng-zorro-antd/empty";

interface ChartSettings {
  chartData: ChartData<'bar' | 'line', (number | null)[]>;
  chartOptions: ChartOptions<'bar' | 'line'>;
}

@Component({
  selector: 'ats-dividends-chart',
  imports: [
    BaseChartDirective,
    NzEmptyComponent
  ],
  templateUrl: './dividends-chart.component.html',
  styleUrl: './dividends-chart.component.less'
})
export class DividendsChartComponent implements OnChanges {
  dividends = input<Dividend[]>([]);

  protected chartSettings = signal<ChartSettings | null>(null);

  private readonly themeColors$ = this.themeService.getThemeSettings().pipe(
    map(s => s.themeColors),
    shareReplay(1)
  );

  private readonly translator$ = this.translatorService.getTranslator('info/dividends')
    .pipe(
      shareReplay(1)
    );

  constructor(
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService
  ) {
  }

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

              if(tooltipItem.dataset.yAxisID === 'y1') {
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
