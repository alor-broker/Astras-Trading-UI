import { Component, DestroyRef, input, OnDestroy, OnInit, inject } from '@angular/core';
import {BehaviorSubject, combineLatest, defer, interval, Observable, shareReplay, switchMap, take, tap} from "rxjs";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {axisBottom, axisLeft, brush, pointer, ScaleLinear, scaleLinear, select} from "d3";
import {BaseType, Selection} from "d3-selection";
import {BondScreenerService} from "../../services/bond-screener.service";
import {
  ChartParameters,
  YieldCurveChartParametersComponent
} from "../yield-curve-chart-parameters/yield-curve-chart-parameters.component";
import {DurationType, YieldType} from "../../models/bond-yield-curve.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {filter, map, startWith} from "rxjs/operators";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {BondScreenerSettings} from "../../models/bond-screener-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ACTIONS_CONTEXT, ActionsContext} from "../../../../shared/services/actions-context";
import {TranslocoDirective} from '@jsverse/transloco';
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

interface BondDisplay {
  symbol: string;
  exchange: string;
  title: string;
  durationYears: number;
  yield: number;
}

interface DataArtifacts {
  sortedData: BondDisplay[];
  yieldMin: number;
  yieldMax: number;
  durationMax: number;
}

interface ItemPosition {
  xLeft: number;
  xRight: number;
  xRightOffset: number;
  yTop: number;
  yBottom: number;
  yBottomOffset: number;
}

@Component({
  selector: 'ats-yield-curve-chart',
  templateUrl: './yield-curve-chart.component.html',
  styleUrls: ['./yield-curve-chart.component.less'],
  imports: [
    TranslocoDirective,
    YieldCurveChartParametersComponent,
    NzResizeObserverDirective,
    LetDirective,
    NzEmptyComponent,
    NzSpinComponent
  ]
})
export class YieldCurveChartComponent implements OnInit, OnDestroy {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly bondScreenerService = inject(BondScreenerService);
  private readonly translatorService = inject(TranslatorService);
  private readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingStatus$ = new BehaviorSubject<LoadingStatus>(LoadingStatus.Initial);
  readonly loadingStatuses = LoadingStatus;
  readonly guid = input.required<string>();

  readonly chartParameters$ = new BehaviorSubject<ChartParameters>({
    durationType: DurationType.MaturityDateBased,
    yieldType: YieldType.CurrentYield
  });

  private readonly yScaleMaxReserveCoeff = 1.15;
  private readonly yScaleMinReserveCoeff = 0.9;
  private readonly xScaleMaxReserveCoeff = 1.15;
  private readonly xScaleMinReserveCoeff = 0.9;
  private readonly contentSize$ = new BehaviorSubject<ContentSize>({width: 0, height: 0});
  private settings$!: Observable<BondScreenerSettings>;
  private zoomed = false;

  get figureId(): string {
    return `f_${this.guid().replace(/-/g, '')}`;
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
    this.loadingStatus$.complete();
    this.chartParameters$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<BondScreenerSettings>(this.guid())
      .pipe(shareReplay(1));

    this.loadingStatus$.next(LoadingStatus.Loading);

    const refreshTimer$ = defer(() => {
      return interval(1000 * 60 * 2).pipe(
        filter(() => !this.zoomed),
        startWith(0)
      );
    });

    const bondsToDisplay$ = refreshTimer$.pipe(
      tap(() => this.loadingStatus$.next(LoadingStatus.Loading)),
      switchMap(() => this.bondScreenerService.getBondsYieldCurve()),
      mapWith(() => this.chartParameters$, (data, parameters) => ({data, parameters})),
      map(x => {
        if (!x.data) {
          this.loadingStatus$.next(LoadingStatus.Error);
          return null;
        }

        if (x.data.length === 0) {
          this.loadingStatus$.next(LoadingStatus.NoData);
          return null;
        }

        const now = new Date();

        return x.data.map(b => {
          let duration = b.duration;

          if (x.parameters.durationType === DurationType.MacaulayDuration) {
            duration = b.durationMacaulay / 365;
          } else if (x.parameters.durationType === DurationType.MaturityDateBased) {
            duration = (b.maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
          }

          return {
            symbol: b.basicInformation.symbol,
            exchange: b.basicInformation.exchange,
            title: b.basicInformation.shortName,
            durationYears: MathHelper.round(duration, 2),
            yield: MathHelper.round(b.yield[x.parameters.yieldType], 2)
          } as BondDisplay;
        });
      })
    );

    this.loadingStatus$.next(LoadingStatus.Loading);
    combineLatest({
      size: this.contentSize$,
      data: bondsToDisplay$,
      translator: this.translatorService.getTranslator('bond-screener/yield-curve-chart')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => this.drawChart(x.size, x.data, x.translator));
  }

  sizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private drawChart(size: ContentSize, data: BondDisplay[] | null, translator: TranslatorFn): void {
    const figure = select(`#${this.figureId}`);
    figure.selectAll("*").remove();

    if (!data) {
      return;
    }

    const containerSize: ContentSize = {
      width: Math.max(size.width, 100),
      height: Math.max(size.height, 100)
    };

    const svg = figure.append("svg")
      .attr("width", containerSize.width)
      .attr("height", containerSize.height)
      .attr("viewBox", `0 0 ${containerSize.width} ${containerSize.height}`);

    const margins = {
      top: 5,
      right: 0,
      bottom: 0,
      left: 0
    };

    const axisAreaHeight = 45;

    const chartAreaPosition: ItemPosition = {
      xLeft: Math.floor(margins.left + axisAreaHeight),
      xRight: Math.floor(containerSize.width - margins.right),
      xRightOffset: margins.right,
      yTop: margins.top,
      yBottom: Math.floor(containerSize.height - margins.bottom - axisAreaHeight),
      yBottomOffset: margins.bottom + axisAreaHeight
    };

    const defs = svg.append("defs");

    const chartArea = svg.append('g')
      .attr("class", "chart-area")
      .attr("transform", `translate(${chartAreaPosition.xLeft},${chartAreaPosition.yTop})`);

    const tooltipContainer = figure.append('div')
      .attr('class', 'tooltip');

    const dataArtifacts = this.prepareDataArtifacts(data);

    const yAxisPosition: ItemPosition = {
      xLeft: margins.left,
      xRight: chartAreaPosition.xLeft,
      xRightOffset: 0,
      yTop: chartAreaPosition.yTop,
      yBottom: chartAreaPosition.yBottom,
      yBottomOffset: 0
    };

    const xAxisPosition: ItemPosition = {
      xLeft: yAxisPosition.xRight,
      xRight: chartAreaPosition.xRight,
      xRightOffset: 0,
      yTop: chartAreaPosition.yBottom,
      yBottom: Math.round(size.height - margins.bottom),
      yBottomOffset: 0
    };

    const xScale = scaleLinear()
      .domain([0, this.extendDomain(dataArtifacts.durationMax, this.xScaleMaxReserveCoeff)])
      .range([0, xAxisPosition.xRight]);

    const yScale = scaleLinear()
      .domain([this.extendDomain(dataArtifacts.yieldMin, this.yScaleMinReserveCoeff), this.extendDomain(dataArtifacts.yieldMax, this.yScaleMaxReserveCoeff)])
      .range([yAxisPosition.yBottom, 0])
      .nice();

    const yAxisArtifacts = this.drawYAxis(
      chartArea,
      yAxisPosition,
      chartAreaPosition,
      yScale,
      translator
    );

    const xAxisArtifacts = this.drawXAxis(
      chartArea,
      xAxisPosition,
      xScale,
      translator
    );

    this.drawDataPoints(
      chartArea,
      defs,
      xScale,
      yScale,
      dataArtifacts,
      tooltipContainer,
      chartAreaPosition,
      translator,
      () => {
        xAxisArtifacts.applyZoom();
        yAxisArtifacts.applyZoom();
      }
    );

    this.loadingStatus$.next(LoadingStatus.Success);
  }

  private drawYAxis(
    root: Selection<SVGGElement, any, HTMLElement, any>,
    axisPosition: ItemPosition,
    chartAreaPosition: ItemPosition,
    scale: ScaleLinear<number, number>,
    translator: TranslatorFn): {
    applyZoom: () => void;
  } {
    const g = root.append("g")
      .attr("class", "y-axis");

    // title
    g.append("text")
      .attr("class", "axis-title")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .attr("transform", "rotate(-90)")
      .attr("y", -Math.round((axisPosition.xRight - axisPosition.xLeft)))
      .attr("x", -Math.round((axisPosition.yBottom - axisPosition.yTop) / 2))
      .attr("fill", "currentColor")
      .classed("text-label", true)
      .text(translator(['yieldAxisTitle']));

    // axis
    const axisEl = g.append("g")
      .attr("class", "axis");

    const drawAxis = (): void => {
      axisEl.selectAll("*").remove();

      const ticksCount = Math.max(1, Math.min(Math.floor((axisPosition.yBottom - axisPosition.yTop) / 25), 15));

      axisEl
        .transition().duration(750)
        .call(axisLeft(scale)
          .ticks(ticksCount)
          .tickPadding(10)
          .tickSize(-chartAreaPosition.xRight)
        )
        .call(g => g.select(".domain").remove());
    };

    drawAxis();

    return {
      applyZoom: (): void => {
        drawAxis();
      }
    };
  }

  private drawXAxis(
    root: Selection<SVGGElement, any, HTMLElement, any>,
    axisPosition: ItemPosition,
    scale: ScaleLinear<number, number>,
    translator: TranslatorFn): {
    applyZoom: () => void;
  } {
    const g = root.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${axisPosition.yTop})`);

    // title
    g.append("text")
      .attr("class", "axis-title")
      .attr("text-anchor", "middle")
      .attr("x", "48%")
      .attr("y", Math.round((axisPosition.yBottom - axisPosition.yTop) * 0.8))
      .attr("fill", "currentColor")
      .classed("text-label", true)
      .text(translator(['durationAxisTitle']));

    // axis
    const axisEl = g.append("g")
      .attr("class", "axis");

    const drawAxis = (): void => {
      axisEl.selectAll("*").remove();

      const ticksCount = Math.max(1, Math.min(Math.floor((axisPosition.xRight - axisPosition.xLeft) / 30), 20));
      axisEl
        .transition().duration(750)
        .call(
          axisBottom(scale)
            .ticks(ticksCount)
        );
    };

    drawAxis();

    return {
      applyZoom: (): void => {
        drawAxis();
      }
    };
  }

  private prepareDataArtifacts(data: BondDisplay[]): DataArtifacts {
    const artifacts: DataArtifacts = {
      sortedData: data.sort((a, b) => {
        if (a.durationYears === b.durationYears) {
          return a.yield - b.yield;
        }

        return a.durationYears - b.durationYears;
      }),
      yieldMin: data.length > 0 ? data[0].yield : 0,
      yieldMax: 0,
      durationMax: 0
    };

    for (const item of artifacts.sortedData) {
      artifacts.yieldMin = Math.min(artifacts.yieldMin, item.yield);
      artifacts.yieldMax = Math.max(artifacts.yieldMax, item.yield);
      artifacts.durationMax = Math.max(artifacts.durationMax, item.durationYears);
    }

    return artifacts;
  }

  private drawDataPoints(
    root: Selection<SVGGElement, any, HTMLElement, any>,
    defs: Selection<SVGDefsElement, any, HTMLElement, any>,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    dataArtifacts: DataArtifacts,
    tooltipContainer: Selection<HTMLDivElement, any, HTMLElement, any>,
    chartAreaPosition: ItemPosition,
    translator: TranslatorFn,
    onZoom: () => void
  ): void {
    const defaultRadius = 6;
    const hoveredRadius = defaultRadius + 2;
    const defaultOpacity = 0.6;

    const chartAreaClipId = 'chart-area-clip';
    defs.append("svg:clipPath")
      .attr("id", chartAreaClipId)
      .append("svg:rect")
      .attr("x", -hoveredRadius)
      .attr("y", -hoveredRadius)
      .attr("width", chartAreaPosition.xRight - chartAreaPosition.xLeft + hoveredRadius)
      .attr("height", chartAreaPosition.yBottom - chartAreaPosition.yTop + hoveredRadius);

    const g = root.append("g")
      .attr("class", "data-points")
      .attr("clip-path", `url(#${chartAreaClipId})`);

    const b = brush();
    g.append("g")
      .attr("class", "brush")
      .call(b);

    const pointsSelection = g.selectAll(".point")
      .data(dataArtifacts.sortedData)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.durationYears))
      .attr("cy", d => yScale(d.yield))
      .attr("r", defaultRadius)
      .attr("stroke", 'currentColor')
      .style('opacity', defaultOpacity);

    pointsSelection.on(
      "mouseover",
      function () {
        select(this)
          .attr("r", hoveredRadius)
          .style('opacity', 1);
      });

    pointsSelection.on(
      "mouseleave",
      function () {
        select(this)
          .attr("r", defaultRadius)
          .style('opacity', defaultOpacity);
      });

    pointsSelection.on(
      "click",
      (event, d) => this.selectInstrument(d)
    );

    this.applyTooltip(
      pointsSelection,
      tooltipContainer,
      chartAreaPosition,
      (data, tooltip) => {
        tooltip.append('div')
          .style('font-weight', '500')
          .text(data.title);

        tooltip
          .append('div')
          .append('span')
          .text(`${translator(['durationLabel'])}: ${data.durationYears} ${translator(['yearsUnit'])}`);

        tooltip
          .append('div')
          .append('span')
          .text(`${translator(['yieldLabel'])}: ${data.yield} %`);
      }
    );

    let timeoutId: number | null;
    const defaultXDomain = xScale.domain();
    const defaultYDomain = yScale.domain();
    b.on("end", event => {
      const selection = <[[number, number], [number, number]] | null>event.selection;
      if (selection) {
        this.zoomed = true;

        const xDomain = [
          this.extendDomain(xScale.invert(selection[0][0]), this.xScaleMinReserveCoeff),
          this.extendDomain(xScale.invert(selection[1][0]), this.xScaleMaxReserveCoeff)
        ];
        xScale.domain(xDomain);

        const yDomain = [
          this.extendDomain(yScale.invert(selection[1][1]), this.yScaleMinReserveCoeff),
          this.extendDomain(yScale.invert(selection[0][1]), this.yScaleMaxReserveCoeff)
        ];
        yScale.domain(yDomain);

        b.move(g.select(".brush"), null);
      } else {
        if (timeoutId == null) {
          timeoutId = setTimeout(() => timeoutId = null, 350);
          return;
        }

        this.zoomed = false;
        xScale.domain(defaultXDomain);
        yScale.domain(defaultYDomain);
      }

      g.selectAll(".point")
        .transition()
        .duration(1000)
        .attr("cx", d => xScale((<BondDisplay>d).durationYears))
        .attr("cy", d => yScale((<BondDisplay>d).yield));

      onZoom();
    });
  }

  private applyTooltip<GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(
    selection: Selection<GElement, Datum, PElement, PDatum>,
    tooltipContainer: Selection<HTMLDivElement, any, HTMLElement, any>,
    tooltipBounds: ItemPosition,
    onShow: (data: Datum, tooltipContainer: Selection<HTMLDivElement, any, HTMLElement, any>) => void
  ): void {
    const pointerPaddingTop = 2;
    const pointerPaddingBottom = 18;
    const pointerPaddingLeft = 2;
    const pointerPaddingRight = 12;

    const containerHeight = tooltipBounds.yBottom - tooltipBounds.yTop;
    const containerWidth = tooltipBounds.xRight - tooltipBounds.xLeft;

    const handleMouseover = (datum: Datum): void => {
      tooltipContainer.selectAll("*").remove();
      onShow(datum, tooltipContainer);

      tooltipContainer
        .transition()
        .delay(450)
        .style('display', 'block');
    };

    const handleMousemove = (position: [number, number]): void => {
      const mouseX = position[0];
      const mouseY = position[1];

      tooltipContainer
        .style(
          "top",
          mouseY < (containerHeight / 2)
            ? `${mouseY + pointerPaddingBottom + tooltipBounds.yTop}px`
            : "initial"
        )
        .style(
          "right",
          mouseX > containerWidth / 2
            ? `${(tooltipBounds.xRight - tooltipBounds.xLeft) - mouseX + pointerPaddingLeft}px`
            : "initial"
        )
        .style(
          "bottom",
          mouseY > containerHeight / 2
            ? `${(tooltipBounds.yBottom + tooltipBounds.yBottomOffset) - mouseY + pointerPaddingTop}px`
            : "initial"
        )
        .style(
          "left",
          mouseX < containerWidth / 2 ? `${mouseX + pointerPaddingRight + tooltipBounds.xLeft}px` : "initial"
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
        .on("mousemove.tooltip", event => {
          handleMousemove(pointer(event));
        })
        .on("mouseleave.tooltip", () => handleMouseleave());
    });
  }

  private selectInstrument(bond: BondDisplay): void {
    const instrument = {
      symbol: bond.symbol,
      exchange: bond.exchange,
    };

    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument(instrument, s.badgeColor ?? defaultBadgeColor);
    });
  }

  private extendDomain(value: number, coeff: number): number {
    if (value < 0) {
      if (coeff < 1) {
        return value * (2 - coeff);
      } else {
        return (Math.ceil(coeff) - coeff) * value;
      }
    }

    return value * coeff;
  }
}
