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
  take,
  tap,
  timer,
  withLatestFrom
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OptionBoardService } from "../../services/option-board.service";
import { map } from "rxjs/operators";
import { ThemeService } from "../../../../shared/services/theme.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import {
  ChartData,
  ChartOptions,
} from "chart.js/dist/types";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { OptionPlotPoint } from "../../models/option-board.model";

interface ZoomState {
  baseRange: {
    min: number;
    max: number;
  };

  currentMultiplier: number;

  currentRange: {
    from: number;
    to: number;
  };
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
  readonly selectedChartType$ = new BehaviorSubject<ChartType>(ChartType.PriceByAssetPrice);
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

  private readonly zoomMultiplier = 0.2;

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

  applyZoom(step: number, currentLabels: number[]): void {
    const round = (value: number): number => MathHelper.round(value, 6);

    this.zoomState$.pipe(
      take(1)
    ).subscribe(state => {
      let updatedState: ZoomState | null;

      if (state == null) {
        const min = round(currentLabels[0]);
        const max = round(currentLabels[currentLabels.length - 1]) ?? min;

        updatedState = {
          baseRange: { min, max },
          currentRange: { from: min, to: max },
          currentMultiplier: 0
        };
      } else {
        updatedState = {
          ...state
        };
      }

      updatedState.currentMultiplier = Math.round(updatedState.currentMultiplier + step);

      updatedState.currentRange = {
        from: round(updatedState.baseRange.min + (updatedState.baseRange.min * updatedState.currentMultiplier * this.zoomMultiplier)),
        to: round(updatedState.baseRange.max - (updatedState.baseRange.min * updatedState.currentMultiplier * this.zoomMultiplier)),
      };

      if (updatedState.currentRange.from < updatedState.currentRange.to) {
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

    combineLatest([
      this.dataContext.currentSelection$,
      this.selectedChartType$
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.zoomState$.next(null);
    });

    this.chartData$ = combineLatest({
      selection: this.dataContext.currentSelection$,
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
            instrumentKeys: x.selection.selectedOptions,
            range: 0.3,
            selection: x.zoomState?.currentRange
          });
        },
        (source, plots) => ({
          ...source,
          plots,
        })
      ),
      withLatestFrom(this.themeService.getThemeSettings()),
      map(([x, theme]) => {
        if (x.plots == null) {
          return null;
        }

        const labels: number[] = [];
        const positiveValues: (number | null)[] = [];
        const negativeValues: (number | null)[] = [];

        const dataSet = (x.plots as any)[x.currentChartType] as OptionPlotPoint[] ?? [];

        for (const datum of dataSet) {
          labels.push(datum.label);

          if (!isNaN(datum.value)) {
            positiveValues.push(datum.value >= 0 || isNaN(datum.value) ? datum.value : null);
            negativeValues.push(datum.value < 0 ? datum.value : null);
          } else {
            positiveValues.push(null);
            negativeValues.push(null);
          }
        }

        return {
          datasets: [
            {
              data: positiveValues,
              fill: {
                target: { value: 0 },
                above: theme.themeColors.buyColorBackground,
                below: theme.themeColors.buyColorBackground
              },
              borderColor: theme.themeColors.buyColor,
              pointBackgroundColor: theme.themeColors.buyColorBackground
            },
            {
              data: negativeValues,
              fill: {
                target: { value: 0 },
                above: theme.themeColors.sellColorBackground,
                below: theme.themeColors.sellColorBackground
              },
              borderColor: theme.themeColors.sellColor,
              pointBackgroundColor: theme.themeColors.sellColorBackground
            }
          ],
          labels: labels
        };
      }),
      tap(() => this.isLoading$.next(false))
    );
  }
}
