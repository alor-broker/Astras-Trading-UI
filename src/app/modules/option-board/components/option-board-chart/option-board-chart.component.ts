import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";
import {
  ChartConfiguration,
  ChartType
} from "chart.js";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  switchMap,
  tap,
  timer,
  withLatestFrom
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OptionBoardService } from "../../services/option-board.service";
import { map } from "rxjs/operators";
import { ThemeService } from "../../../../shared/services/theme.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ChartData } from "chart.js/dist/types";
import { MathHelper } from "../../../../shared/utils/math-helper";

@Component({
  selector: 'ats-option-board-chart',
  templateUrl: './option-board-chart.component.html',
  styleUrl: './option-board-chart.component.less'
})
export class OptionBoardChartComponent implements OnInit, OnDestroy {
  isLoading$ = new BehaviorSubject<boolean>(false);
  selectedRange$ = new BehaviorSubject<{ from: number, to: number } | null>(null);
  @Input({ required: true })
  dataContext!: OptionBoardDataContext;
  lineChartType: ChartType = 'line';
  chartData$!: Observable<ChartData<'line', number[], number> | null>;
  chartOptions: ChartConfiguration['options'] = {
    maintainAspectRatio: false,
    elements: {
      line: {},
    },
    plugins: {
      legend: { display: false }
    },
  };
  private readonly zoomMultiplier = 0.2;

  constructor(
    private readonly optionBoardService: OptionBoardService,
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.isLoading$.next(false);
  }

  ngOnInit(): void {
    this.initDataStream();
  }

  initDataStream(): void {
    const refreshTimer$ = timer(0, 60000).pipe(
      // for some reasons timer pipe is not completed in detailsDisplay$ when component destroyed (https://github.com/alor-broker/Astras-Trading-UI/issues/1176)
      // so we need to add takeUntil condition for this stream separately
      takeUntilDestroyed(this.destroyRef)
    );

    this.chartData$ = combineLatest({
      selection: this.dataContext.currentSelection$,
      selectedRange: this.selectedRange$
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
          selection: x.selectedRange ?? undefined
        });
      }),
      withLatestFrom(this.themeService.getThemeSettings()),
      map(([plots, theme]) => {
        if (plots == null) {
          return null;
        }

        const labels: number[] = [];
        const values: number[] = [];

        for (const datum of plots.priceByAssetPrice) {
          labels.push(datum.label);
          values.push(datum.value);
        }

        return {
          datasets: [
            {
              data: values,
              backgroundColor: 'rgba(148,159,177,0.2)',
              borderColor: 'rgba(148,159,177,1)',
              pointBackgroundColor: 'rgba(148,159,177,1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(148,159,177,0.8)',
              fill: {
                target: { value: 0 },
                above: theme.themeColors.buyColorBackground,
                below: theme.themeColors.sellColorBackground
              }
            }
          ],
          labels: labels
        };
      }),
      tap(() => this.isLoading$.next(false))
    );
  }

  applyZoom(step: number, currentLabels: number[]): void {
    const round = (value: number): number => MathHelper.round(value, 6);

    const minValue = round(currentLabels[0]);
    const maxValue = round(currentLabels[currentLabels.length - 1]) ?? minValue;

    const from = round(minValue + (minValue * this.zoomMultiplier * step));
    const to = round(maxValue - (maxValue * this.zoomMultiplier * step));

    if (from < to) {
      this.selectedRange$.next({ from, to });
    }
  }
}
