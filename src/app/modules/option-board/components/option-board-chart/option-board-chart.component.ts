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
  switchMap,
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

@Component({
  selector: 'ats-option-board-chart',
  templateUrl: './option-board-chart.component.html',
  styleUrl: './option-board-chart.component.less'
})
export class OptionBoardChartComponent implements OnInit, OnDestroy {
  isLoading$ = new BehaviorSubject<boolean>(false);
  zoomState$ = new BehaviorSubject<ZoomState | null>(null);
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
    this.isLoading$.next(false);
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
      theme: this.themeService.getThemeSettings(),
      translator: this.translatorService.getTranslator('option-board/option-board-chart')
    })

      .pipe(
        map(x => {
          return {
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: x.translator(['priceByAssetPrice', 'x', 'title'])
                },
                ticks: {
                  color: x.theme.themeColors.chartLabelsColor
                }
              },
              y: {
                title: {
                  display: true,
                  text: x.translator(['priceByAssetPrice', 'y', 'title'])
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

    this.chartData$ = combineLatest({
      selection: this.dataContext.currentSelection$,
      zoomState: this.zoomState$
    }).pipe(
      mapWith(() => refreshTimer$, source => source),
      switchMap(x => {
        if (x.selection.selectedOptions.length === 0) {
          return of(null);
        }

        this.isLoading$.next(true);
        return this.optionBoardService.getPlots({
          instrumentKeys: x.selection.selectedOptions,
          range: 0.3,
          selection: x.zoomState?.currentRange
        });
      }),
      withLatestFrom(this.themeService.getThemeSettings()),
      map(([plots, theme]) => {
        if (plots == null) {
          return null;
        }

        const labels: number[] = [];
        const positiveValues: (number | null)[] = [];
        const negativeValues: (number | null)[] = [];

        for (const datum of plots.priceByAssetPrice) {
          labels.push(datum.label);

          positiveValues.push(datum.value >= 0 ? datum.value : null);
          negativeValues.push(datum.value < 0 ? datum.value : null);
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
