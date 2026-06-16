import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  switchMap
} from 'rxjs';
import {
  map,
  tap
} from 'rxjs/operators';
import {
  ChartData,
  ChartOptions
} from 'chart.js';
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval';
import eachWeekOfInterval from 'date-fns/eachWeekOfInterval';
import eachYearOfInterval from 'date-fns/eachYearOfInterval';
import endOfDay from 'date-fns/endOfDay';
import {format} from 'date-fns';
import startOfDay from 'date-fns/startOfDay';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import startOfYear from 'date-fns/startOfYear';
import subMonths from 'date-fns/subMonths';
import subYears from 'date-fns/subYears';
import {
  enUS,
  ru
} from 'date-fns/locale';
import {
  takeUntilDestroyed,
  toObservable
} from '@angular/core/rxjs-interop';
import {LetDirective} from '@ngrx/component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzSkeletonComponent} from 'ng-zorro-antd/skeleton';
import {BaseChartDirective} from 'ng2-charts';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from 'ng-zorro-antd/radio';
import {FormsModule} from '@angular/forms';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {
  PortfolioCommission,
  PortfolioCommissionPeriod,
  PortfolioCommissionsService
} from '../../services/portfolio-commissions.service';

type CommissionsChartData = ChartData<'bar', number[], Date>;
type CommissionsChartOptions = ChartOptions<'bar'>;

interface ChartConfig {
  chartData: CommissionsChartData;
  chartOptions: CommissionsChartOptions;
  rawData: PortfolioCommission[];
}

interface PortfolioCommissionsDatesRange {
  dateFrom: Date;
  dateTo: Date;
}

@Component({
  selector: 'ats-portfolio-commissions-chart',
  imports: [
    LetDirective,
    TranslocoDirective,
    NzSkeletonComponent,
    BaseChartDirective,
    NzEmptyComponent,
    NzSpinComponent,
    NzRadioGroupComponent,
    NzRadioComponent,
    FormsModule
  ],
  templateUrl: './portfolio-commissions-chart.html',
  styleUrl: './portfolio-commissions-chart.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PortfolioCommissionsChart implements OnInit, OnDestroy {
  chartConfig$!: Observable<ChartConfig | null>;

  readonly selectedPeriod$ = new BehaviorSubject<PortfolioCommissionPeriod>(PortfolioCommissionPeriod.Week);

  readonly availablePeriods = Object.values(PortfolioCommissionPeriod);

  readonly portfolio = input.required<string>();

  readonly isLoading = signal(false);

  private readonly portfolioCommissionsService = inject(PortfolioCommissionsService);

  private readonly themeService = inject(ThemeService);

  private readonly translatorService = inject(TranslatorService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshIntervalSec = 60;

  private readonly portfolioChanges$ = toObservable(this.portfolio);

  ngOnDestroy(): void {
    this.selectedPeriod$.complete();
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    const commissions$ = combineLatest({
      portfolio: this.portfolioChanges$.pipe(distinctUntilChanged()),
      selectedPeriod: this.selectedPeriod$
    }).pipe(
      withRefresh(this.refreshIntervalSec * 1000, this.applicationStatusService.isActive$),
      tap(() => this.isLoading.set(true)),
      switchMap(x => {
        const datesRange = this.getDatesRange(x.selectedPeriod);

        return this.portfolioCommissionsService.getPortfolioCommissions(
          x.portfolio,
          x.selectedPeriod,
          datesRange.dateFrom,
          datesRange.dateTo
        ).pipe(
          map(data => ({
            data,
            period: x.selectedPeriod,
            datesRange
          }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    this.chartConfig$ = combineLatest({
      commissions: commissions$,
      themeColors: this.themeService.getThemeSettings().pipe(map(settings => settings.themeColors)),
      lang: this.translatorService.getLangChanges(),
      translator: this.translatorService.getTranslator('portfolio-charts/commissions')
    }).pipe(
      tap(() => this.isLoading.set(true)),
      map(x => {
        if (x.commissions.data == null || x.commissions.data.length === 0) {
          return null;
        }

        const completedCommissions = this.completeCommissions(
          x.commissions.data,
          x.commissions.period,
          x.commissions.datesRange
        );

        return {
          chartData: this.prepareDatasets(completedCommissions, x.themeColors),
          chartOptions: this.prepareChartOptions(x.lang, x.commissions.period, x.translator, completedCommissions),
          rawData: completedCommissions
        };
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  private prepareDatasets(
    commissions: PortfolioCommission[],
    themeColors: ThemeColors
  ): CommissionsChartData {
    return {
      datasets: [
        {
          data: commissions.map(item => item.commissionAmount),
          backgroundColor: themeColors.primaryColor,
          borderColor: themeColors.primaryColor,
          hoverBackgroundColor: themeColors.purpleColor,
          maxBarThickness: 28
        }
      ],
      labels: commissions.map(item => item.periodStart)
    };
  }

  private prepareChartOptions(
    lang: string,
    period: PortfolioCommissionPeriod,
    translator: TranslatorFn,
    commissions: PortfolioCommission[]
  ): CommissionsChartOptions {
    return {
      maintainAspectRatio: false,
      locale: lang,
      interaction: {
        intersect: true,
        mode: 'nearest'
      },
      plugins: {
        legend: {display: false},
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (tooltipItems): string => {
              const periodStart = commissions[tooltipItems[0].dataIndex]?.periodStart;

              if (periodStart == null) {
                return '';
              }

              return format(
                periodStart,
                this.getDateFormat(period),
                {
                  locale: this.getDateLocale(lang)
                }
              );
            },
            label: (tooltipItem): string => {
              const value = typeof tooltipItem.parsed.y === 'number'
                ? tooltipItem.parsed.y
                : 0;

              return `${translator(['tooltip', 'commissionAmount'])}: ${this.formatAmount(value, lang)}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            minUnit: this.getMinUnit(period),
            displayFormats: {
              day: 'dd.MM',
              week: 'dd.MM',
              month: 'MM.yyyy',
              year: 'yyyy'
            }
          },
          adapters: {
            date: {
              locale: this.getDateLocale(lang)
            }
          },
          ticks: {
            source: 'labels',
            autoSkip: true,
            maxTicksLimit: 6,
            align: 'center'
          }
        },
        y: {
          position: 'right',
          beginAtZero: true
        }
      }
    };
  }

  private completeCommissions(
    commissions: PortfolioCommission[],
    period: PortfolioCommissionPeriod,
    datesRange: PortfolioCommissionsDatesRange
  ): PortfolioCommission[] {
    const sourceByPeriodStart = new Map(
      commissions.map(item => [
        this.getPeriodStart(item.periodStart, period).getTime(),
        item
      ])
    );
    const account = commissions[0].account;

    return this.getPeriodStarts(period, datesRange).map(periodStart => {
      const sourceItem = sourceByPeriodStart.get(periodStart.getTime());

      if (sourceItem != null) {
        return {
          ...sourceItem,
          periodStart
        };
      }

      return {
        account,
        periodStart,
        period,
        commissionAmount: 0
      };
    });
  }

  private getPeriodStarts(
    period: PortfolioCommissionPeriod,
    datesRange: PortfolioCommissionsDatesRange
  ): Date[] {
    switch (period) {
      case PortfolioCommissionPeriod.Month: {
        return eachMonthOfInterval({
          start: datesRange.dateFrom,
          end: datesRange.dateTo
        });
      }
      case PortfolioCommissionPeriod.Year: {
        return eachYearOfInterval({
          start: datesRange.dateFrom,
          end: datesRange.dateTo
        });
      }
      default: {
        return eachWeekOfInterval(
          {
            start: datesRange.dateFrom,
            end: datesRange.dateTo
          },
          {weekStartsOn: 1}
        );
      }
    }
  }

  private getDatesRange(period: PortfolioCommissionPeriod): PortfolioCommissionsDatesRange {
    const now = new Date();

    switch (period) {
      case PortfolioCommissionPeriod.Month: {
        return {
          dateFrom: startOfDay(subYears(now, 1)),
          dateTo: endOfDay(now)
        };
      }
      case PortfolioCommissionPeriod.Year: {
        return {
          dateFrom: startOfDay(subYears(now, 10)),
          dateTo: endOfDay(now)
        };
      }
      default: {
        return {
          dateFrom: startOfDay(subMonths(now, 3)),
          dateTo: endOfDay(now)
        };
      }
    }
  }

  private getPeriodStart(date: Date, period: PortfolioCommissionPeriod): Date {
    switch (period) {
      case PortfolioCommissionPeriod.Month: {
        return startOfMonth(date);
      }
      case PortfolioCommissionPeriod.Year: {
        return startOfYear(date);
      }
      default: {
        return startOfWeek(date, {weekStartsOn: 1});
      }
    }
  }

  private getMinUnit(period: PortfolioCommissionPeriod): 'day' | 'month' | 'year' {
    switch (period) {
      case PortfolioCommissionPeriod.Month: {
        return 'month';
      }
      case PortfolioCommissionPeriod.Year: {
        return 'year';
      }
      default: {
        return 'day';
      }
    }
  }

  private getDateFormat(period: PortfolioCommissionPeriod): string {
    switch (period) {
      case PortfolioCommissionPeriod.Month: {
        return 'MMM yyyy';
      }
      case PortfolioCommissionPeriod.Year: {
        return 'yyyy';
      }
      default: {
        return 'd MMM yyyy';
      }
    }
  }

  private getDateLocale(lang: string): Locale {
    return lang === 'ru' ? ru : enUS;
  }

  private formatAmount(value: number, lang: string): string {
    return new Intl.NumberFormat(lang, {
      maximumFractionDigits: 3,
      minimumFractionDigits: 0
    }).format(value);
  }
}
