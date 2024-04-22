import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  shareReplay,
  take,
  tap,
  timer,
  withLatestFrom
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OptionBoardService } from "../../services/option-board.service";
import {
  debounceTime,
  map
} from "rxjs/operators";
import { ThemeService } from "../../../../shared/services/theme.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import {
  ChartData,
  ChartOptions,
} from "chart.js/dist/types";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {
  OptionPlot,
  OptionPlotPoint
} from "../../models/option-board.model";
import { OptionBoardDataContextFactory } from "../../utils/option-board-data-context-factory";
import { ThemeSettings } from "../../../../shared/models/settings/theme-settings.model";

interface ZoomState {
  currentRange: number;
}

enum ChartType {
  PriceByAssetPrice = 'priceByAssetPrice',
  PriceByVolatility = 'priceByVolatility',
  PriceByYears = 'priceByYears',
  PriceByStrikePrice = 'priceByStrikePrice',
  ProfitLossByAssetPrice = 'profitLossByAssetPrice',
}


@Component({
  selector: 'ats-option-board-chart',
  templateUrl: './option-board-chart.component.html',
  styleUrl: './option-board-chart.component.less'
})
export class OptionBoardChartComponent implements OnInit, OnDestroy {
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly zoomState$ = new BehaviorSubject<ZoomState | null>(null);
  readonly selectedChartType$ = new BehaviorSubject<ChartType>(ChartType.ProfitLossByAssetPrice);
  readonly chartTypes = [
    ChartType.PriceByAssetPrice,
    ChartType.PriceByVolatility,
    ChartType.PriceByStrikePrice,
    ChartType.ProfitLossByAssetPrice,
  ];

  @Input({ required: true })
  dataContext!: OptionBoardDataContext;
  chartData$!: Observable<ChartData<'line', (number | null)[], number> | null>;
  chartOptions$!: Observable<ChartOptions<'line'>>;

  private readonly zoomStep = 0.1;
  private readonly defaultRange = 0.1;

  constructor(
    private readonly optionBoardService: OptionBoardService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.zoomState$.complete();
    this.selectedChartType$.complete();
  }

  ngOnInit(): void {
    this.initOptions();
    this.initDataStream();
  }

  applyZoom(step: number): void {
    this.zoomState$.pipe(
      take(1)
    ).subscribe(state => {
      let updatedState: ZoomState | null;

      if (state == null) {
        updatedState = {
          currentRange: this.defaultRange
        };
      } else {
        updatedState = {
          ...state
        };
      }

      updatedState.currentRange = MathHelper.round(updatedState.currentRange + (-1 * step * this.zoomStep), 1);
      if (updatedState.currentRange <= 0) {
        updatedState.currentRange = 0.01;
      }

      if (state == null || state.currentRange !== updatedState.currentRange) {
        this.zoomState$.next(updatedState);
      }
    });
  }

  private initOptions(): void {
    this.chartOptions$ = combineLatest({
      selectedChartType: this.selectedChartType$,
      theme: this.themeService.getThemeSettings(),
      translator: this.translatorService.getTranslator('option-board/option-board-chart')
    }).pipe(
      map(x => {
        return {
          maintainAspectRatio: false,
          layout: {
            padding: 0
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              callbacks: {
                title: (tooltipItems): string => {
                  return `${x.translator([x.selectedChartType, 'x', 'title'])}: ${Number(tooltipItems[0].label).toLocaleString()}`;
                },
                label: (tooltipItem): string => {
                  return `${x.translator([x.selectedChartType, 'y', 'title'])}: ${Number(tooltipItem.raw).toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: x.translator([x.selectedChartType, 'x', 'title'])
              },
              ticks: {
                color: x.theme.themeColors.chartLabelsColor
              }
            },
            y: {
              title: {
                display: true,
                text: x.translator([x.selectedChartType, 'y', 'title'])
              },
              ticks: {
                color: x.theme.themeColors.chartLabelsColor
              }
            }
          }
        };
      })
    );
  }

  private initDataStream(): void {
    const refreshTimer$ = timer(0, 60000).pipe(
      // for some reasons timer pipe is not completed in detailsDisplay$ when component destroyed (https://github.com/alor-broker/Astras-Trading-UI/issues/1176)
      // so we need to add takeUntil condition for this stream separately
      takeUntilDestroyed(this.destroyRef)
    );

    const selectionParameters$ = this.dataContext.selectionParameters$.pipe(
      debounceTime(2000),
      shareReplay(1)
    );

    combineLatest([
      this.dataContext.currentSelection$,
      selectionParameters$,
      this.selectedChartType$
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.zoomState$.next(null);
    });

    this.chartData$ = combineLatest({
      selection: this.dataContext.currentSelection$,
      parameters: selectionParameters$,
      currentChartType: this.selectedChartType$,
      zoomState: this.zoomState$
    }).pipe(
      mapWith(() => refreshTimer$, source => source),
      mapWith(x => {
          if (x.selection.selectedOptions.length === 0) {
            return of(null);
          }

          this.isLoading$.next(true);
          return this.optionBoardService.getPlots({
            instrumentKeys: x.selection.selectedOptions.map(o => {
              const parameters = x.parameters.get(OptionBoardDataContextFactory.getParametersKey(o));
              const quantity = parameters?.quantity ?? 1;

              return {
                ...o,
                quantity
              };
            }),
            range: x.zoomState?.currentRange ?? this.defaultRange
          });
        },
        (source, plots) => ({
          ...source,
          plots,
        })
      ),
      withLatestFrom(this.themeService.getThemeSettings()),
      map(([x, theme]) => {
        return this.prepareDatasets(x, theme);
      }),
      tap(() => this.isLoading$.next(false))
    );
  }

  private prepareDatasets(
    selection: { plots: OptionPlot | null, currentChartType: ChartType },
    theme: ThemeSettings
  ): ChartData<'line', (number | null)[], number> | null {
    if (selection.plots == null) {
      return null;
    }

    const labels: number[] = [];
    const values: (number | null)[] = [];

    const dataSet = ((selection.plots as any)[selection.currentChartType] as OptionPlotPoint[] ?? [])
      .filter(x => !isNaN(x.label))
      .sort((a, b) => a.label - b.label);

    for (const datum of dataSet) {

      labels.push(datum.label);

      if (!isNaN(datum.value)) {
        values.push(datum.value);
      } else {
        values.push(null);
      }
    }

    const colors = values.map((value) => (value ?? 0) >= 0 ? theme.themeColors.buyColor : theme.themeColors.sellColor);

    return {
      datasets: [
        {
          data: values,
          fill: {
            target: { value: 0 },
            above: theme.themeColors.buyColorBackground,
            below: theme.themeColors.sellColorBackground
          },
          pointBorderColor: colors,
          pointBackgroundColor: colors,
          segment: {
            borderColor: (part): string => {
              const prevValue = part.p0.parsed.y;
              const nextValue = part.p1.parsed.y;

              if ((prevValue < 0 && nextValue > 0) || (nextValue < 0 && prevValue > 0)) {
                return theme.themeColors.mixColor;
              }

              return prevValue < 0 || nextValue < 0 ? theme.themeColors.sellColor : theme.themeColors.buyColor;
            },
          },
        }
      ],
      labels: labels
    };
  }
}
