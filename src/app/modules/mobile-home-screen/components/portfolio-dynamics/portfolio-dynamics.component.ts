import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { LoadingEvent } from "../../models/components.model";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import { AccountService } from "../../../../shared/services/account.service";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
} from 'rxjs';
import {
  filter,
  map
} from "rxjs/operators";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import {
  ChartData,
  ChartOptions
} from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { PortfolioDynamics } from "../../../../shared/models/user/portfolio-dynamics.model";
import { ThemeService } from 'src/app/shared/services/theme.service';
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ThemeColors } from "../../../../shared/models/settings/theme-settings.model";
import { color } from "d3";
import {
  add,
  format
} from "date-fns";
import {
  enUS,
  ru
} from 'date-fns/locale';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import type { Duration } from "date-fns/types";
import {
  NgClass,
  PercentPipe
} from "@angular/common";

type DynamicsChartData = ChartData<'line', number[], Date>;
type DynamicsChartOptions = ChartOptions<'line'>;

interface ChartConfig {
  chartData: DynamicsChartData;
  charOptions: DynamicsChartOptions;
  rawData: PortfolioDynamics | null;
}

enum TimeRange {
  W1 = "W1",
  M1 = "1M",
  M6 = "6M",
  Y1 = "1Y",
  ALL = "ALL",
}

@Component({
  selector: 'ats-portfolio-dynamics',
  standalone: true,
  imports: [
    BaseChartDirective,
    NzButtonComponent,
    TranslocoDirective,
    LetDirective,
    PercentPipe,
    NgClass
  ],
  templateUrl: './portfolio-dynamics.component.html',
  styleUrl: './portfolio-dynamics.component.less'
})
export class PortfolioDynamicsComponent implements OnInit, OnDestroy {
  readonly chartHeight = 250;
  @ViewChild('utilsCanvas')
  utilsCanvas!: ElementRef<HTMLCanvasElement>;

  @Input({required: true})
  guid!: string;

  @Output()
  loadingChanged = new EventEmitter<LoadingEvent>();

  chartConfig$!: Observable<ChartConfig | null>;
  readonly selectedTimeRange$ = new BehaviorSubject<TimeRange>(TimeRange.W1);

  readonly availableTimeRanges = Object.values(TimeRange);

  constructor(
    private readonly accountService: AccountService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.chartConfig$ = combineLatest({
      currentAgreement: this.getCurrentAgreement(),
      selectedTimeRange: this.selectedTimeRange$,
      themeColors: this.themeService.getThemeSettings().pipe(map(s => s.themeColors)),
      lang: this.translatorService.getLangChanges()
    }).pipe(
      mapWith(
        x => {
          const datesRange = this.getDatesRange(x.selectedTimeRange);

          return this.accountService.getPortfolioDynamicsForAgreement(
            x.currentAgreement,
            datesRange.fromDate,
            datesRange.toDate
          );
        },
        (source, output) => ({
          ...source,
          data: output
        })),
      map(x => {
        if (x.data == null) {
          return null;
        }

        return {
          chartData: this.prepareDatasets(x.data, x.themeColors),
          charOptions: this.prepareChartOptions(x.lang),
          rawData: x.data
        };
      })
    );
  }

  ngOnDestroy(): void {
    this.selectedTimeRange$.complete();
  }

  private getDatesRange(timeRange: TimeRange): { fromDate: Date, toDate: Date } {
    const toDate = new Date();
    let duration: Duration = {
      weeks: -1
    };

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

  private riseLoadingChanged(loading: boolean): void {
    setTimeout(() => {
      this.loadingChanged.emit({loading, source: 'portfolio-dynamics'});
    });
  }

  private getCurrentAgreement(): Observable<string> {
    return combineLatest({
      selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.getPortfolios()
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => isPortfoliosEqual(p, x.selectedPortfolio));
      }),
      filter(p => !!p),
      map(p => p.agreement),
      distinctUntilChanged((previous, current) => previous === current)
    );
  }

  private prepareDatasets(dynamics: PortfolioDynamics, themeColors: ThemeColors): DynamicsChartData {
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
            above: this.createFillCanvasGradient(themeColors)
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
                new Date(tooltipItems[0].parsed.x),
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

  private getDateLocale(lang: string): Locale {
    return lang === 'ru' ? ru : enUS;
  }

  private createFillCanvasGradient(themeColors: ThemeColors): CanvasGradient {
    const gradient = this.utilsCanvas.nativeElement.getContext('2d')!.createLinearGradient(0, 0, 0, this.chartHeight);

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
