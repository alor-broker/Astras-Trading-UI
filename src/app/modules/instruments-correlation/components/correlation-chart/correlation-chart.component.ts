import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  take,
  tap
} from "rxjs";
import { ContentSize } from "../../../../shared/models/dashboard/dashboard-item.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  axisBottom,
  axisRight,
  create,
  interpolateRdYlGn,
  scaleBand,
  ScaleDiverging,
  scaleDiverging,
  scaleLinear,
  select
} from "d3";
import {
  Watchlist,
  WatchlistType
} from "../../../instruments/models/watchlist.model";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import {
  filter,
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import { WatchListTitleHelper } from "../../../instruments/utils/watch-list-title.helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { InstrumentsCorrelationService } from "../../services/instruments-correlation.service";
import { InstrumentsCorrelationSettings } from "../../models/instruments-correlation-settings.model";
import {
  DetrendType,
  InstrumentsCorrelationResponse
} from "../../models/instruments-correlation.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { MathHelper } from "../../../../shared/utils/math-helper";

enum LoadingStatus {
  Initial = 'initial',
  Loading = 'loading',
  NoData = 'no-data',
  Success = 'success'
}

interface ItemMeasurements {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

interface MatrixCell {
  correlation: number;
  cointegration: boolean;
}

interface CorrelationMatrix {
  indexes: string[];
  matrix: MatrixCell[][];
}

@Component({
  selector: 'ats-correlation-chart',
  templateUrl: './correlation-chart.component.html',
  styleUrls: ['./correlation-chart.component.less']
})
export class CorrelationChartComponent implements OnInit, OnDestroy {
  readonly loadingStatus$ = new BehaviorSubject<LoadingStatus>(LoadingStatus.Initial);
  readonly loadingStatuses = LoadingStatus;
  readonly timeframes = [
    {
      key: 'month',
      value: 30
    },
    {
      key: 'quarter',
      value: 90
    },
    {
      key: 'halfYear',
      value: 180
    },
    {
      key: 'year',
      value: 360
    },
  ];

  readonly detrendTypes = Object.values(DetrendType);

  @Input({ required: true })
  guid!: string;

  availableLists$!: Observable<Watchlist[]>;
  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  parametersForm = this.formBuilder.group({
    targetListId: this.formBuilder.control<string | null>(
      null,
      Validators.required
    ),
    days: this.formBuilder.nonNullable.control(
      this.timeframes[0].value,
      Validators.required
    ),
    detrendType: this.formBuilder.nonNullable.control(
      DetrendType.Linear,
      Validators.required
    )
  });

  private readonly contentSize$ = new BehaviorSubject<ContentSize>({ width: 0, height: 0 });
  private settings$!: Observable<InstrumentsCorrelationSettings>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly instrumentsCorrelationService: InstrumentsCorrelationService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  get figureId(): string {
    return `f_${this.guid.replace(/-/g, '')}`;
  }

  sizeChanged(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
    this.loadingStatus$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<InstrumentsCorrelationSettings>(this.guid).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.availableLists$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(c => c.collection),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.setInitialRequestValues();

    const correlationData$ = this.parametersForm.valueChanges.pipe(
      startWith(this.parametersForm.value),
      filter(() => this.parametersForm.valid),
      tap(() => this.saveCurrentParameters()),
      tap(() => this.loadingStatus$.next(LoadingStatus.Loading)),
      mapWith(
        () => this.availableLists$,
        (params, allLists) => ({
          ...params,
          targetWatchlist: allLists.find(l => l.id === params.targetListId!)!
        })
      ),
      switchMap(x => this.instrumentsCorrelationService.getCorrelation({
          instruments: x.targetWatchlist.items,
          days: x.days!,
          detrendType: x.detrendType!
        })
      ),
      map(x => this.toMatrix(x)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    combineLatest({
      size: this.contentSize$,
      data: correlationData$,
      translator: this.translatorService.getTranslator('instruments-correlation/correlation-chart')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      // clean;
      const figure = select(`#${this.figureId}`);
      figure.selectAll("*").remove();

      if (!x.data) {
        this.loadingStatus$.next(LoadingStatus.NoData);
        return;
      }

      this.loadingStatus$.next(LoadingStatus.Success);

      const svg = figure.append("svg")
        .attr("width", x.size.width)
        .attr("height", x.size.height);

      const topMargin = 5;
      const bottomMargin = 45;
      const leftMargin = 0;
      const rightMargin = 50;

      const bodyPosition: ItemMeasurements = {
        xLeft: leftMargin,
        xRight: x.size.width - rightMargin,
        yTop: topMargin,
        yBottom: x.size.height - bottomMargin,
      };


      const xScale = scaleBand(x.data.indexes, [bodyPosition.xLeft, bodyPosition.xRight]);
      const yScale = scaleBand(x.data.indexes, [bodyPosition.yTop, bodyPosition.yBottom]);

      // start plot
      const color = scaleDiverging([-1, 0, 1], interpolateRdYlGn);


      svg.append("g")
        .selectAll("g")
        .data(x.data.indexes)
        .join('g')
        .selectAll('g')
        .data((datum, dIndex) => x.data!.matrix[dIndex].map((value, index) => ({
            rowInstrument: datum,
            colInstrument: x.data!.indexes[index],
            cellValue: value
          }))
        )
        .join(enter => {
          const g = enter.append("g");

          g.append("title")
            .text(d => {
              const correlationPercent = MathHelper.round(d.cellValue.correlation * 100, 1);
              //TODO: rework tooltip
              return `${d.rowInstrument} - ${d.colInstrument}
${correlationPercent}%`;
            });

          g.append("rect")
            .attr("x", d => xScale(d.colInstrument)!)
            .attr("y", d => yScale(d.rowInstrument)!)
            .attr("width", xScale.bandwidth() - 1)
            .attr("height", yScale.bandwidth() - 1)
            .attr("fill", d => color(d.cellValue.correlation));

          g.append("text")
            .attr("x", d => xScale(d.colInstrument)! + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.rowInstrument)! + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .text(d => d.cellValue.cointegration ? x.translator(['cointegrationMark']) : '');

          return g;
        });
      // end plot

      // start axis
      if (xScale.bandwidth() > 30) {
        svg.append("g")
          .attr("transform", `translate(0,${bodyPosition.yBottom})`)
          .call(axisBottom(xScale))
          .call(g => {
            g.select(".domain").remove();

            g.selectAll('text')
              .text((d: any) => {
                const symbol = d.split(':')[1];

                let maxLength = 3;
                const bandWidth = xScale.bandwidth();
                if (bandWidth > 80) {
                  maxLength = 8;
                } else if (bandWidth > 50) {
                  maxLength = 5;
                } else if (bandWidth > 40) {
                  maxLength = 4;
                }

                if (symbol.length > maxLength) {
                  return `${symbol.slice(0, maxLength)}...`;
                }

                return symbol;
              });

            g.selectAll('.tick')
              .append('title')
              .text((d: any) => d);
          });
      }

      svg.append("g")
        .attr("transform", `translate(${bodyPosition.xRight},0)`)
        .call(axisRight(yScale))
        .call(g => {
          g.select(".domain").remove();

          g.selectAll('text')
            .text((d: any) => {
              const symbol = d.split(':')[1];
              if (symbol.length > 4) {
                return `${symbol.slice(0, 4)}...`;
              }

              return symbol;
            });

          g.selectAll('.tick')
            .append('title')
            .text((d: any) => d);
        });
      // end axis

      // start legend
      svg.append("g")
        .attr("transform", `translate(0,${bodyPosition.yBottom + bottomMargin / 2})`)
        .append(() => this.drawLegend(
          color,
          {
            width: 75
          }
        ));

      svg.append("g")
        .attr("transform", `translate(80,${bodyPosition.yBottom + bottomMargin / 2})`)
        .call(g => {
          g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill-opacity", 0)
            .style("stroke", "currentColor");

          g.append("text")
            .attr("x", 10)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .attr("fill", "currentColor")
            .text(x.translator(['cointegrationMark']));

          g.append("text")
            .attr("x", 25)
            .attr("y", 10)
            .attr("alignment-baseline", "central")
            .attr("fill", "currentColor")
            .text(`- ${x.translator(['cointegrationLegend'])}`);

        });

      // end legend
    });
  }

  private setInitialRequestValues() {
    combineLatest({
        settings: this.settings$,
        allLists: this.availableLists$
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
      const lastParams = x.settings.lastRequestParams;

      let currentListId: string | null = null;
      if (x.allLists.find(l => l.id === lastParams?.listId)) {
        currentListId = lastParams!.listId;
      } else {
        const historyList = x.allLists.find(l => l.type === WatchlistType.HistoryList);
        if (!!historyList) {
          currentListId = historyList.id;
        } else {
          const defaultList = x.allLists.find(l => l.isDefault || l.type === WatchlistType.DefaultList);
          if (!!defaultList) {
            currentListId = defaultList.id;
          }
        }
      }

      if (!!currentListId) {
        this.parametersForm.controls.targetListId.setValue(currentListId);
      }

      this.parametersForm.controls.days.setValue(lastParams?.days ?? this.timeframes[0].value);
      this.parametersForm.controls.detrendType.setValue(lastParams?.detrendType ?? DetrendType.Linear);
    });
  }

  private saveCurrentParameters() {
    if (!this.parametersForm.valid) {
      return;
    }

    const formValue = this.parametersForm.value;
    this.widgetSettingsService.updateSettings<InstrumentsCorrelationSettings>(
      this.guid,
      {
        lastRequestParams: {
          listId: formValue.targetListId!,
          days: formValue.days!,
          detrendType: formValue.detrendType!
        }
      }
    );
  }

  private toMatrix(response: InstrumentsCorrelationResponse | null): CorrelationMatrix | null {
    if (!response) {
      return null;
    }

    const indexes = Object.keys(response.correlation).sort((a, b) => a.localeCompare(b));

    const matrix: MatrixCell[][] = [];
    for (let i = 0; i < indexes.length; i++) {
      const matrixRow: MatrixCell[] = [];
      matrix.push(matrixRow);
      const rowInstrument = indexes[i];
      for (let j = 0; j < indexes.length; j++) {
        const colInstrument = indexes[j];

        matrixRow.push({
          correlation: response.correlation[rowInstrument][colInstrument],
          cointegration: response.cointegration[rowInstrument][colInstrument] === 1
        });
      }
    }

    return {
      indexes,
      matrix
    };
  }

  private drawLegend(
    color: ScaleDiverging<string>,
    params: {
      width: number

    }): SVGSVGElement | null {
    const svg = create("svg")
      .attr("width", params.width)
      .attr("height", 25)
      .style("overflow", "visible")
      .style("display", "block");

    const scale = color.copy();

    const ramp = document.createElement("canvas");
    ramp.width = 256;
    ramp.height = 1;
    const context = ramp.getContext("2d");
    const interpolator = scale.interpolator();
    for (let i = 0; i < ramp.width; ++i) {
      context!.fillStyle = interpolator(i / (ramp.width - 1));
      context!.fillRect(i, 0, 1, 1);
    }

    svg.append("image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", params.width)
      .attr("height", 10)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp.toDataURL());

    const ticks = [-1, 0, 1];

    svg.append("g")
      .attr("transform", `translate(0,5)`)
      .call(axisBottom(scaleLinear(ticks, [5, params.width / 2]))
        .ticks(3, 'd')
        .tickValues(ticks)
      )
      .call(g => g.select(".domain").remove());

    return svg.node();
  }
}
