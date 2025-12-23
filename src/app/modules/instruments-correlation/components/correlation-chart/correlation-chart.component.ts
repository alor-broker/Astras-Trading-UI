import { Component, DestroyRef, input, OnDestroy, OnInit, inject } from '@angular/core';
import {BehaviorSubject, combineLatest, shareReplay, tap} from "rxjs";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  axisBottom,
  axisRight,
  interpolateRdYlGn,
  pointer,
  scaleBand,
  ScaleDiverging,
  scaleDiverging,
  scaleLinear,
  select,
  zoom
} from "d3";
import {filter, map, switchMap} from "rxjs/operators";
import {InstrumentsCorrelationService} from "../../services/instruments-correlation.service";
import {
  InstrumentsCorrelationErrorCodes,
  InstrumentsCorrelationRequest,
  InstrumentsCorrelationResponse
} from "../../models/instruments-correlation.model";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {BaseType, Selection} from "d3-selection";
import {ScaleBand} from "d3-scale";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {G} from "@angular/cdk/keycodes";
import {TranslocoDirective} from '@jsverse/transloco';
import {ChartFiltersComponent} from '../chart-filters/chart-filters.component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {LetDirective} from '@ngrx/component';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzSpinComponent} from 'ng-zorro-antd/spin';

enum LoadingStatus {
  Initial = 'initial',
  Loading = 'loading',
  NoData = 'no-data',
  Success = 'success',
  Error = 'error'
}

interface LoadingError {
  errorCode: InstrumentsCorrelationErrorCodes;
  errorMessage?: string;
}

interface ItemPosition {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

interface ChartItemsPositions {
  matrixArea: ItemPosition;
  xAxis: ItemPosition;
  yAxis: ItemPosition;
  colorLegend: ItemPosition;
  symbolsLegend: ItemPosition;
}

interface MatrixCell {
  correlation: number;
  cointegration: boolean | null;
}

interface CorrelationMatrix {
  indexes: string[];
  matrix: MatrixCell[][];
}

@Component({
  selector: 'ats-correlation-chart',
  templateUrl: './correlation-chart.component.html',
  styleUrls: ['./correlation-chart.component.less'],
  imports: [
    TranslocoDirective,
    ChartFiltersComponent,
    NzResizeObserverDirective,
    LetDirective,
    NzEmptyComponent,
    NzSpinComponent
  ]
})
export class CorrelationChartComponent implements OnInit, OnDestroy {
  private readonly instrumentsCorrelationService = inject(InstrumentsCorrelationService);
  private readonly translatorService = inject(TranslatorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingStatus$ = new BehaviorSubject<LoadingStatus>(LoadingStatus.Initial);
  readonly request$ = new BehaviorSubject<InstrumentsCorrelationRequest | null>(null);
  readonly loadingStatuses = LoadingStatus;

  readonly guid = input.required<string>();

  loadingError: LoadingError | null = null;
  protected readonly G = G;
  private readonly contentSize$ = new BehaviorSubject<ContentSize>({width: 0, height: 0});

  get figureId(): string {
    return `f_${this.guid().replace(/-/g, '')}`;
  }

  sizeChanged(entries: ResizeObserverEntry[]): void {
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
    this.request$.complete();
  }

  ngOnInit(): void {
    this.loadingStatus$.next(LoadingStatus.Loading);

    const correlationData$ = this.request$.pipe(
      filter((r): r is InstrumentsCorrelationRequest => !!r),
      tap(() => this.loadingStatus$.next(LoadingStatus.Loading)),
      switchMap(r => this.instrumentsCorrelationService.getCorrelation(r)),
      map(x => {
        if (x.errorCode != null) {
          this.loadingError = {
            errorCode: x.errorCode,
            errorMessage: x.errorMessage
          };

          this.loadingStatus$.next(LoadingStatus.Error);
          return null;
        }

        this.loadingError = null;
        const matrix = this.toMatrix(x);
        if (!matrix) {
          this.loadingStatus$.next(LoadingStatus.NoData);
          return null;
        }

        return matrix;
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );

    combineLatest({
      size: this.contentSize$,
      data: correlationData$,
      translator: this.translatorService.getTranslator('instruments-correlation/correlation-chart')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      const figure = select(`#${this.figureId}`);
      figure.selectAll("*").remove();

      if (!x.data) {
        return;
      }

      const containerSize: ContentSize = {
        width: Math.max(x.size.width, 100),
        height: Math.max(x.size.height, 100)
      };

      const svg = figure.append("svg")
        .attr("width", containerSize.width)
        .attr("height", containerSize.height)
        .attr("viewBox", `0 0 ${containerSize.width} ${containerSize.height}`);

      svg.append("defs");

      const tooltip = figure.append('div')
        .attr('class', 'tooltip');

      const positions = this.getChartItemsPositions(containerSize);

      const xScale = scaleBand(x.data.indexes, [positions.matrixArea.xLeft, positions.matrixArea.xRight]);
      const yScale = scaleBand(x.data.indexes, [positions.matrixArea.yTop, positions.matrixArea.yBottom]);
      const colorScale = scaleDiverging([-1, 0, 1], interpolateRdYlGn);

      const matrixAreaArtifacts = this.drawMatrixArea(
        positions.matrixArea,
        svg,
        tooltip,
        xScale,
        yScale,
        colorScale,
        x.data,
        x.translator,
        containerSize
      );

      const xAxisArtifacts = this.drawXAxis(
        positions.xAxis,
        svg,
        xScale
      );

      const yAxisArtifacts = this.drawYAxis(
        positions.yAxis,
        svg,
        yScale
      );

      this.drawColorLegend(
        positions.colorLegend,
        svg,
        colorScale
      );

      this.drawSymbolsLegend(
        positions.symbolsLegend,
        svg,
        x.translator
      );

      const zoomBehavior = zoom<SVGSVGElement, any>();
      zoomBehavior.scaleExtent([1, 10]);
      zoomBehavior.translateExtent([[positions.matrixArea.xLeft, positions.matrixArea.yTop], [positions.matrixArea.xRight, positions.matrixArea.yBottom]]);
      zoomBehavior.extent([[positions.matrixArea.xLeft, positions.matrixArea.yTop], [positions.matrixArea.xRight, positions.matrixArea.yBottom]]);

      zoomBehavior.on('zoom end', (event) => {
        xScale.range([positions.matrixArea.xLeft, positions.matrixArea.xRight].map(r => event.transform.applyX(r) as number));
        yScale.range([positions.matrixArea.yTop, positions.matrixArea.yBottom].map(r => event.transform.applyY(r) as number));

        matrixAreaArtifacts.onZoom();
        xAxisArtifacts.onZoom();
        yAxisArtifacts.onZoom();
      });

      svg.call(zoomBehavior);

      svg.on('contextmenu', event => {
        event.preventDefault();
        zoomBehavior.scaleTo(svg.transition(), 1);
      });

      this.loadingStatus$.next(LoadingStatus.Success);
    });
  }

  private drawMatrixArea(
    position: ItemPosition,
    root: Selection<SVGSVGElement, any, HTMLElement, any>,
    tooltipContainer: Selection<HTMLDivElement, any, HTMLElement, any>,
    xScale: ScaleBand<string>,
    yScale: ScaleBand<string>,
    colorScale: ScaleDiverging<string, never>,
    data: CorrelationMatrix,
    translator: TranslatorFn,
    containerSize: ContentSize
  ): { onZoom: () => void } {
    const matrixClipId = 'matrix-clip';

    const clipPath = root.select('defs').append("svg:clipPath");
    clipPath.attr("id", matrixClipId);

    const clipPathRect = clipPath.append("svg:rect");
    clipPathRect
      .attr("width", position.xRight - position.xLeft)
      .attr("height", position.yBottom - position.yTop)
      .attr("x", position.xLeft)
      .attr("y", position.yTop);

    const matrixArea = root.append("g");
    matrixArea
      .attr("class", "matrix-area")
      .attr("clip-path", `url(#${matrixClipId})`);

    const matrixRows = matrixArea
      .selectAll("g")
      .data(data.indexes)
      .join(elem => {
        return elem
          .append('g')
          .attr('class', 'matrix-row');
      });

    matrixRows.selectAll('g')
      .data((datum, dIndex) => data!.matrix[dIndex].map((value, index) => ({
          rowInstrument: datum,
          colInstrument: data!.indexes[index],
          cellValue: value
        }))
      )
      .join(enter => {
        const cell = enter.append("g");
        cell.attr('class', 'matrix-cell');

        this.applyTooltip(
          cell,
          tooltipContainer,
          containerSize,
          (data, tooltip) => {
            tooltip.append('div')
              .style('font-weight', '500')
              .text(`${this.getSymbol(data.rowInstrument)} - ${this.getSymbol(data.colInstrument)}`);

            const correlationPercent = MathHelper.round(data.cellValue.correlation * 100, 1);

            const secondLine = tooltip.append('div');
            secondLine.append('span')
              .text(`${translator(['correlationLabel'])}: `);

            secondLine.append('span')
              .style('font-weight', '500')
              .style('color',
                () => {
                  if (correlationPercent > 0) {
                    return colorScale.interpolator()(100);
                  }

                  if (correlationPercent < 0) {
                    return colorScale.interpolator()(-100);
                  }

                  return null;
                }
              )
              .text(`${correlationPercent}%`);
          }
        );

        cell.append("rect")
          .attr("class", "cell-rect")
          .attr("x", d => xScale(d.colInstrument)!)
          .attr("y", d => yScale(d.rowInstrument)!)
          .attr("width", xScale.bandwidth() - 1)
          .attr("height", yScale.bandwidth() - 1)
          .attr("fill", d => colorScale(d.cellValue.correlation));

        cell.append("text")
          .attr("class", "cell-text")
          .attr("x", d => xScale(d.colInstrument)! + xScale.bandwidth() / 2)
          .attr("y", d => yScale(d.rowInstrument)! + yScale.bandwidth() / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style('user-select', 'none')
          .text(d => {
            if (d.cellValue.cointegration == null) {
              return '-';
            }

            return d.cellValue.cointegration ? translator(['cointegrationMark']) : '';
          });

        return cell;
      });

    return {
      onZoom: (): void => {
        matrixRows.selectAll(".cell-rect")
          .attr("x", (d: any) => xScale(d.colInstrument)!)
          .attr("y", (d: any) => yScale(d.rowInstrument)!)
          .attr("width", xScale.bandwidth() - 1)
          .attr("height", yScale.bandwidth() - 1);

        matrixRows.selectAll(".cell-text")
          .attr("x", (d: any) => xScale(d.colInstrument)! + xScale.bandwidth() / 2)
          .attr("y", (d: any) => yScale(d.rowInstrument)! + yScale.bandwidth() / 2);
      }
    };
  }

  private drawXAxis(
    position: ItemPosition,
    root: Selection<SVGSVGElement, any, HTMLElement, any>,
    xScale: ScaleBand<string>,
  ): { onZoom: () => void } {
    const axisClipId = 'x-axis-clip';

    const clipPath = root.select('defs').append("svg:clipPath");
    clipPath.attr("id", axisClipId);

    const clipPathRect = clipPath.append("svg:rect");
    clipPathRect
      .attr("width", position.xRight - position.xLeft)
      .attr("height", position.yBottom - position.yTop)
      .attr("x", 0)
      .attr("y", 0);

    const xAxis = root.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(${position.xLeft},${position.yTop})`)
      .attr("clip-path", `url(#${axisClipId})`)
      .style('display', 'none')
      .style('user-select', 'none');

    const draw = (): void => {
      xAxis
        .call(axisBottom(xScale))
        .call(g => {
          g.select(".domain").remove();

          g.selectAll('text')
            .text((d: any) => {
              const symbol = this.getSymbol(d);

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
            .text(d => d as string);
        });

      xAxis.style('display', () => xScale.bandwidth() > 30 ? 'block' : 'none');
    };

    draw();

    return {
      onZoom: () => draw()
    };
  }

  private drawYAxis(
    position: ItemPosition,
    root: Selection<SVGSVGElement, any, HTMLElement, any>,
    yScale: ScaleBand<string>,
  ): { onZoom: () => void } {
    const axisClipId = 'y-axis-clip';

    const clipPath = root.select('defs').append("svg:clipPath");
    clipPath.attr("id", axisClipId);

    const clipPathRect = clipPath.append("svg:rect");
    clipPathRect
      .attr("width", position.xRight - position.xLeft)
      .attr("height", position.yBottom - position.yTop)
      .attr("x", 0)
      .attr("y", 0);

    const yAxis = root.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${position.xLeft},${position.yTop})`)
      .attr("clip-path", `url(#${axisClipId})`)
      .style('display', 'none')
      .style('user-select', 'none');

    const draw = (): void => {
      yAxis.call(axisRight(yScale))
        .call(g => {
          g.select(".domain").remove();

          g.selectAll('text')
            .text((d: any) => {
              const symbol = this.getSymbol(d);
              if (symbol.length > 4) {
                return `${symbol.slice(0, 4)}...`;
              }

              return symbol;
            });

          g.selectAll('.tick')
            .append('title')
            .text(d => d as string);
        });

      yAxis.style('display', () => yScale.bandwidth() > 8 ? 'block' : 'none');
    };

    draw();

    return {
      onZoom: () => draw()
    };
  }

  private drawColorLegend(
    position: ItemPosition,
    root: Selection<SVGSVGElement, any, HTMLElement, any>,
    colorScale: ScaleDiverging<string>,
  ): void {
    const container = root.append("g")
      .attr('class', 'color-legend')
      .attr("transform", `translate(${position.xLeft},${position.yTop})`);

    const width = position.xRight - position.xLeft;
    const legend = container.append("svg");
    legend
      .attr("width", width)
      .attr("height", position.yBottom - position.yTop)
      .style("overflow", "visible")
      .style("display", "block");

    const ramp = document.createElement("canvas");
    ramp.width = 256;
    ramp.height = 1;
    const context = ramp.getContext("2d");
    const interpolator = colorScale.interpolator();
    for (let i = 0; i < ramp.width; ++i) {
      context!.fillStyle = interpolator(i / (ramp.width - 1));
      context!.fillRect(i, 0, 1, 1);
    }

    legend.append("image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", 10)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp.toDataURL());

    const ticksMargin = 10;
    legend.append("g")
      .attr("transform", `translate(0,5)`)
      .style('user-select', 'none')
      .call(axisBottom(scaleLinear([-100, 100], [ticksMargin, width - ticksMargin]))
        .ticks(3, 'd')
        .tickValues([-100, 0, 100])
      )
      .call(g => g.select(".domain").remove());
  }

  private drawSymbolsLegend(
    position: ItemPosition,
    root: Selection<SVGSVGElement, any, HTMLElement, any>,
    translator: TranslatorFn
  ): void {
    const container = root.append("g")
      .attr("transform", `translate(${position.xLeft},${position.yTop})`)
      .attr('class', 'symbols-legend')
      .style('user-select', 'none');

    const height = position.yBottom - position.yTop;

    container.call(g => {
      const borderWidth = 1;
      g.append("rect")
        .attr("x", borderWidth)
        .attr("y", borderWidth)
        .attr("width", height - borderWidth * 2)
        .attr("height", height - borderWidth * 2)
        .attr("fill-opacity", 0)
        .style("stroke", "currentColor")
        .style('stroke-width', borderWidth);

      g.append("text")
        .attr("x", height / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "currentColor")
        .text(translator(['cointegrationMark']));

      g.append("text")
        .attr("x", height + 5)
        .attr("y", height / 2)
        .attr("alignment-baseline", "central")
        .attr("fill", "currentColor")
        .text(`- ${translator(['cointegrationLegend'])}`);
    });
  }

  private applyTooltip<GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(
    selection: Selection<GElement, Datum, PElement, PDatum>,
    tooltipContainer: Selection<HTMLDivElement, any, HTMLElement, any>,
    containerSize: ContentSize,
    onShow: (data: Datum, tooltipContainer: Selection<HTMLDivElement, any, HTMLElement, any>) => void
  ): void {
    const pointerPaddingTop = 2;
    const pointerPaddingBottom = 18;
    const pointerPaddingLeft = 2;
    const pointerPaddingRight = 12;

    const handleMouseover = (datum: Datum): void => {
      tooltipContainer.selectAll("*").remove();
      onShow(datum, tooltipContainer);

      tooltipContainer
        .transition()
        .delay(750)
        .style('display', 'block');
    };

    const handleMousemove = (position: [number, number]): void => {
      const mouseX = position[0];
      const mouseY = position[1];

      tooltipContainer
        .style(
          "top",
          mouseY < (containerSize.height / 2) ? `${mouseY + pointerPaddingBottom}px` : "initial"
        )
        .style(
          "right",
          mouseX > containerSize.width / 2
            ? `${containerSize.width - mouseX + pointerPaddingLeft}px`
            : "initial"
        )
        .style(
          "bottom",
          mouseY > containerSize.height / 2
            ? `${containerSize.height - mouseY + pointerPaddingTop}px`
            : "initial"
        )
        .style(
          "left",
          mouseX < containerSize.width / 2 ? `${mouseX + pointerPaddingRight}px` : "initial"
        );
    };

    const handleMouseleave = (): void => {
      tooltipContainer
        .transition()
        .style('display', 'none');
    };

    selection.each(function (datum) {
      select(this)
        .on("mouseover.tooltip", () => handleMouseover(datum))
        .on("mousemove.tooltip", event => handleMousemove(pointer(event)))
        .on("mouseleave.tooltip", () => handleMouseleave());
    });
  }

  private toMatrix(response: InstrumentsCorrelationResponse): CorrelationMatrix | null {
    if (!response.data) {
      return null;
    }

    const indexes = Object.keys(response.data.correlation).sort((a, b) => a.localeCompare(b));

    const matrix: MatrixCell[][] = [];
    for (const rowInstrument of indexes) {
      const matrixRow: MatrixCell[] = [];
      matrix.push(matrixRow);

      for (const colInstrument of indexes) {
        matrixRow.push({
          correlation: response.data.correlation[rowInstrument][colInstrument],
          cointegration: response.data.cointegration == null
            ? null
            : response.data.cointegration?.[rowInstrument][colInstrument] === 1
        });
      }
    }

    return {
      indexes,
      matrix
    };
  }

  private getChartItemsPositions(containerSize: ContentSize): ChartItemsPositions {
    const xAxisHeight = 25;
    const yAxisWidth = 50;
    const legendHeight = 22;

    const colorLegend: ItemPosition = {
      xLeft: 0,
      yTop: containerSize.height - legendHeight,
      xRight: 75,
      yBottom: containerSize.height
    };

    const symbolsLegend: ItemPosition = {
      xLeft: colorLegend.xRight + 5,
      yTop: containerSize.height - legendHeight,
      xRight: containerSize.width,
      yBottom: containerSize.height
    };

    const xAxis: ItemPosition = {
      xLeft: 0,
      yTop: colorLegend.yTop - xAxisHeight,
      xRight: containerSize.width - yAxisWidth,
      yBottom: colorLegend.yTop
    };

    const yAxis: ItemPosition = {
      xLeft: containerSize.width - yAxisWidth,
      yTop: 0,
      xRight: containerSize.width,
      yBottom: xAxis.yTop
    };

    const matrixArea: ItemPosition = {
      xLeft: 0,
      yTop: 0,
      xRight: yAxis.xLeft,
      yBottom: yAxis.yBottom,
    };

    return {
      matrixArea,
      xAxis,
      yAxis,
      colorLegend,
      symbolsLegend
    };
  }

  private getSymbol(symbolWithExchange: string): string {
    const parts = symbolWithExchange.split(':');

    return parts.length > 1
      ? parts[1]
      : symbolWithExchange;
  }
}
