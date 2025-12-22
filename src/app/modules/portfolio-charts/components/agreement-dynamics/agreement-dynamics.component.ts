import {Component, DestroyRef, ElementRef, input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest, filter, Observable, switchMap, timer} from "rxjs";
import {ChartData, ChartOptions} from "chart.js";
import {PortfolioDynamics} from "../../../../shared/models/user/portfolio-dynamics.model";
import {LetDirective} from "@ngrx/component";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {BaseChartDirective} from "ng2-charts";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {debounceTime, map, tap} from "rxjs/operators";
import {AccountService} from "../../../../shared/services/account.service";
import {ThemeService} from "../../../../shared/services/theme.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {add, format} from "date-fns";
import {ThemeColors} from "../../../../shared/models/settings/theme-settings.model";
import {color} from "d3";
import {enUS, ru} from "date-fns/locale";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {NgClass, PercentPipe} from "@angular/common";

enum TimeRange {
  W1 = "W1",
  M1 = "1M",
  M6 = "6M",
  Y1 = "1Y",
  ALL = "ALL",
}

type DynamicsChartData = ChartData<'line', number[], Date>;
type DynamicsChartOptions = ChartOptions<'line'>;

interface ChartConfig {
  agreement: string;
  chartData: DynamicsChartData;
  charOptions: DynamicsChartOptions;
  rawData: PortfolioDynamics | null;
}

@Component({
  selector: 'ats-agreement-dynamics',
  imports: [
    LetDirective,
    TranslocoDirective,
    NzSkeletonComponent,
    BaseChartDirective,
    NzEmptyComponent,
    NzSpinComponent,
    NzButtonComponent,
    NzResizeObserverDirective,
    NgClass,
    PercentPipe
  ],
  templateUrl: './agreement-dynamics.component.html',
  styleUrl: './agreement-dynamics.component.less'
})
export class AgreementDynamicsComponent implements OnInit, OnDestroy {
  @ViewChild('utilsCanvas')
  utilsCanvas!: ElementRef<HTMLCanvasElement>;

  chartConfig$!: Observable<ChartConfig | null>;

  readonly selectedTimeRange$ = new BehaviorSubject<TimeRange>(TimeRange.W1);
  readonly availableTimeRanges = Object.values(TimeRange);
  isLoading = false;
  readonly agreement = input<string>();
  private readonly refreshIntervalSec = 60;
  private readonly containerSize$ = new BehaviorSubject<ContentSize>({
    height: 0,
    width: 0,
  });

  private readonly agreementChanges$ = toObservable(this.agreement);

  constructor(
    private readonly accountService: AccountService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.selectedTimeRange$.complete();
  }

  ngOnInit(): void {
    this.isLoading = true;

    const refresh$ = timer(0, this.refreshIntervalSec * 1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    );

    const chartData$ = combineLatest({
      refresh$: refresh$,
      currentAgreement: this.agreementChanges$.pipe(filter(a => a != null)),
      selectedTimeRange: this.selectedTimeRange$,
    }).pipe(
      tap(() => this.isLoading = true),
      switchMap(x => {
        const datesRange = this.getDatesRange(x.selectedTimeRange);

        return this.accountService.getPortfolioDynamicsForAgreement(
          x.currentAgreement,
          datesRange.fromDate,
          datesRange.toDate
        ).pipe(
          map(d => ({
            agreement: x.currentAgreement,
            data: d
          }))
        );
      })
    );

    const sizeChange$ = this.containerSize$.pipe(
      debounceTime(500)
    );

    this.chartConfig$ = combineLatest({
      chartData: chartData$,
      themeColors: this.themeService.getThemeSettings().pipe(map(s => s.themeColors)),
      lang: this.translatorService.getLangChanges(),
      containerSize: sizeChange$,
    }).pipe(
      tap(() => this.isLoading = true),
      map(x => {
        if (x.chartData.data == null) {
          return null;
        }

        return {
          chartData: this.prepareDatasets(x.chartData.data, x.themeColors, x.containerSize),
          charOptions: this.prepareChartOptions(x.lang),
          rawData: x.chartData.data,
          agreement: x.chartData.agreement
        };
      }),
      tap(() => this.isLoading = false),
    );
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.containerSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private prepareDatasets(dynamics: PortfolioDynamics, themeColors: ThemeColors, contentSize: ContentSize): DynamicsChartData {
    const backgroundColor = color(themeColors.primaryColor);
    if (backgroundColor != null) {
      backgroundColor.opacity = 0;
    }

    return {
      datasets: [
        {
          tension: 0.2,
          data: dynamics.portfolioValues.map(v => v.value),
          borderColor: themeColors.primaryColor,
          fill: {
            target: 'origin',
            above: this.createFillCanvasGradient(themeColors, contentSize)
          }
        }
      ],
      labels: dynamics.portfolioValues.map(v => v.date)
    };
  }

  private prepareChartOptions(lang: string): DynamicsChartOptions {
    return {
      maintainAspectRatio: false,
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
            }
          }
        }
      },
      scales: {
        x: {
          type: "time",
          adapters: {
            date: {
              locale: this.getDateLocale(lang)
            }
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 5,
            align: 'start'
          }
        },
        y: {
          position: "right"
        }
      }
    };
  }

  private getDatesRange(timeRange: TimeRange): { fromDate: Date, toDate: Date } {
    const toDate = new Date();
    let duration: Duration;

    switch (timeRange) {
      case TimeRange.M1: {
        duration = {
          months: -1
        };
        break;
      }
      case TimeRange.M6: {
        duration = {
          months: -6
        };
        break;
      }
      case TimeRange.Y1: {
        duration = {
          years: -1
        };
        break;
      }
      case TimeRange.ALL: {
        duration = {
          years: -20
        };
        break;
      }
      default: {
        duration = {
          weeks: -1
        };
      }
    }

    return {
      fromDate: add(toDate, duration),
      toDate
    };
  }

  private getDateLocale(lang: string): Locale {
    return lang === 'ru' ? ru : enUS;
  }

  private createFillCanvasGradient(themeColors: ThemeColors, contentSize: ContentSize): CanvasGradient {
    const gradient = this.utilsCanvas.nativeElement.getContext('2d')!.createLinearGradient(0, 0, 0, contentSize.height);

    const baseColor = color(themeColors.primaryColor);
    if (baseColor != null) {
      baseColor.opacity = 0.85;
      gradient.addColorStop(0, baseColor.formatRgb());
      baseColor.opacity = 0.3;
      gradient.addColorStop(0.3, baseColor.formatRgb());

      baseColor.opacity = 0.05;
      gradient.addColorStop(0.75, baseColor.formatRgb());

      baseColor.opacity = 0;
      gradient.addColorStop(1, baseColor.formatRgb());
    }

    return gradient;
  }
}
