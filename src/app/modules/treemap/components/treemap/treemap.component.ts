import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ActiveElement,
  Chart,
  ChartEvent,
  TooltipModel
} from "chart.js";
import {
  TreemapController,
  TreemapElement
} from "chartjs-chart-treemap";
import { TreemapService } from "../../services/treemap.service";
import {
  debounceTime,
  filter,
  map,
  switchMap
} from "rxjs/operators";
import { ThemeService } from "../../../../shared/services/theme.service";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  Subscription,
  take,
  withLatestFrom
} from "rxjs";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import {
  formatCurrency,
  getCurrencySign
} from "../../../../shared/utils/formatters";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { getNumberAbbreviation } from "../../../../shared/utils/number-abbreviation";
import { color } from "d3";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface TooltipModelRaw {
  _data: {
    label: string;
    sector: string;
    children: {
      symbol: string;
      dayChange: number;
      marketCap: number;
    }[];
  };
}

interface TooltipData {
  title: string;
  body: string[];
}

@Component({
  selector: 'ats-treemap',
  templateUrl: './treemap.component.html',
  styleUrls: ['./treemap.component.less']
})
export class TreemapComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('treemapWrapper') treemapWrapperEl?: ElementRef<HTMLDivElement>;
  @Input({ required: true })
  guid!: string;
  isCursorOnSector$ = new BehaviorSubject(false);
  // this widget works  with MOEX exchange only
  private readonly defaultExchange = 'MOEX';
  private chart?: Chart;
  private readonly selectedSector$ = new BehaviorSubject('');
  private readonly tilesCount$ = new BehaviorSubject(0);
  private readonly maxDayChange = 5;
  private readonly averageTileSize = 4000;

  private readonly newTooltip$ = new BehaviorSubject<TooltipModel<'treemap'> | null>(null);
  private tooltipData$?: Observable<TooltipData>;

  constructor(
    private readonly treemapService: TreemapService,
    private readonly themeService: ThemeService,
    private readonly quotesService: QuotesService,
    private readonly translatorService: TranslatorService,
    private readonly instrumentsService: InstrumentsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService,
    private readonly destroy: DestroyRef
  ) {
  }

  ngOnInit(): void {
    Chart.register(TreemapController, TreemapElement);
  }

  ngAfterViewInit(): void {
    this.tilesCount$.next(
      Math.floor(this.treemapWrapperEl!.nativeElement.clientWidth * this.treemapWrapperEl!.nativeElement.clientHeight / this.averageTileSize)
    );

    const treemap$ = this.tilesCount$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(limit => this.treemapService.getTreemap(limit))
    );

    combineLatest([
      treemap$,
      this.selectedSector$,
      this.themeService.getThemeSettings()
    ])
      .pipe(
        map(([treemap, sector, theme]) => ({
          treemap: treemap
            .filter(t => t.sector.includes(sector))
            .map(t => ({
              ...t,
              dayChangeAbs: Math.abs(t.dayChange)
            })),
          themeColors: theme.themeColors
        })),
      )
      .subscribe(({ treemap, themeColors }) => {
        const ctx = (<HTMLCanvasElement>document.getElementById(this.guid)).getContext('2d');

        if (!ctx) {
          return;
        }

        this.chart?.clear();
        this.chart?.destroy();

        this.chart = new Chart(ctx, {
          type: 'treemap',
          data: {
            datasets: [
              {
                tree: treemap,
                key: 'marketCap',
                groups: ['sector', 'symbol'],
                borderWidth: 0,
                spacing: 2,
                captions: {
                  display: true,
                  color: themeColors.chartLabelsColor,
                  font: { weight: '500' }
                },
                labels: {
                  display: true,
                  formatter: (t: any) => [t.raw._data.symbol, `${t.raw._data.children[0]?.dayChange}%`] as string[],
                  overflow: 'fit',
                  color: themeColors.textColor,
                  font: [{ weight: '600' }, { weight: '400' }]
                },
                backgroundColor: (t: any) => {
                  if (t.raw?._data.label === t.raw?._data.sector) {
                    return themeColors.chartShadow;
                  } else {
                    const c = t.raw._data.children[0]?.dayChange > 0
                      ? color(themeColors.buyColor)
                      : color(themeColors.sellColor);

                    if(!!c) {
                      c.opacity = t.raw._data.children[0]?.dayChangeAbs / this.maxDayChange;
                    }

                    return c?.formatRgb() ?? '';
                  }
                },
                borderRadius: 4
              } as any
            ],
          },
          options: {
            onResize: (chart: Chart, { width, height }): void => {
              this.tilesCount$.next(Math.floor(width * height / this.averageTileSize));
            },
            onHover: (event: ChartEvent, elements: ActiveElement[]): void => {
              this.isCursorOnSector$.next(elements.length === 1);
            },
            color: themeColors.chartLabelsColor,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false,
                external: this.getExternalTooltipFn()
              },
            },
            onClick: (event: ChartEvent, elements: ActiveElement[]): void => {
              if (elements.length === 1) {
                this.selectedSector$
                  .pipe(
                    take(1)
                  )
                  .subscribe(sector => {
                    if (sector) {
                      this.selectedSector$.next('');
                    } else {
                      this.selectedSector$.next((<any>elements[0].element).$context.raw.g);
                    }
                  });
              }

              if (elements.length > 1) {
                this.selectInstrument((<any>elements[1].element).$context.raw.g);
              }
            }
          }
        });
      });
  }

  ngOnDestroy(): void {
    this.selectedSector$.complete();
    this.isCursorOnSector$.complete();
    this.newTooltip$.complete();
  }

  private getExternalTooltipFn(): (this: TooltipModel<'treemap'>, args: { chart: Chart, tooltip: TooltipModel<'treemap'> }) => void {
    let tooltipDataSub: Subscription | undefined;

    return (context): void => {
      let tooltipEl = this.treemapWrapperEl?.nativeElement.querySelector('.treemap-tooltip') as HTMLDivElement | null | undefined;

      if (!tooltipEl) {
        return;
      }

      const tooltipModel = context.tooltip;
      tooltipDataSub?.unsubscribe();

      // Hide if no tooltip
      if (tooltipModel.opacity === 0) {

        tooltipEl.style.opacity = '0';
        return;
      }

      tooltipDataSub = this.getTooltipData(tooltipModel)
        .pipe(
          take(1)
        )
        .subscribe(tooltipData => {
          // Set Text
          let innerHtml = '';

          innerHtml += '<p class="title">' + tooltipData.title + '</p>';

          tooltipData.body.forEach(body => {
            innerHtml += '<p class="description">' + body + '</p>';
          });

          tooltipEl!.innerHTML = innerHtml;

          // Max left and top position for tooltip (to avoid borders to crawl behind widget)
          const tooltipMaxLeftPosition = (this.treemapWrapperEl?.nativeElement.clientWidth ?? Infinity) - tooltipEl!.clientWidth;
          const tooltipMaxTopPosition = (this.treemapWrapperEl?.nativeElement.clientHeight ?? Infinity) - tooltipEl!.clientHeight;

          // Display and positioning
          tooltipEl!.style.left = Math.min(tooltipModel.caretX, tooltipMaxLeftPosition).toString() + 'px';
          tooltipEl!.style.top = Math.min(tooltipModel.caretY, tooltipMaxTopPosition).toString() + 'px';
          tooltipEl!.style.opacity = '1';
        });
    };
  }

  private getTooltipData(tooltipModel: TooltipModel<'treemap'>): Observable<TooltipData> {
    if (!this.tooltipData$) {
      this.tooltipData$ = this.newTooltip$
        .pipe(
          takeUntilDestroyed(this.destroy),
          filter((t): t is TooltipModel<'treemap'>  => t != null),
          debounceTime(100),
          switchMap(tm => {
            const instrumentDataPoint = tm.dataPoints.find((dp: any) => dp.raw._data.label != dp.raw._data.sector);

            if (!instrumentDataPoint) {
              return of({ body: [], title: (tm.dataPoints[0].raw as TooltipModelRaw)._data.label });
            }

            const treemapNode = (instrumentDataPoint.raw as TooltipModelRaw)._data.children[0];

            return this.quotesService.getLastQuoteInfo(treemapNode.symbol, this.defaultExchange)
              .pipe(
                withLatestFrom(
                  this.translatorService.getTranslator('treemap'),
                  this.translatorService.getTranslator('shared/short-number'),
                  this.instrumentsService.getInstrument({ exchange: this.defaultExchange, symbol: treemapNode.symbol })
                ),
                map(([quote, tTreemap, tShortNumber, instrument]) => {
                  const marketCapBase = getNumberAbbreviation(treemapNode.marketCap, true);
                  return {
                    title: treemapNode.symbol,
                    body: [
                      `${tTreemap(['company'])}: ${quote?.description}`,
                      `${tTreemap(['dayChange'])}: ${treemapNode.dayChange}%`,
                      `${tTreemap(['marketCap'])}: ${marketCapBase!.value}${tShortNumber([
                        marketCapBase!.suffixName!,
                        'long'
                      ])} ${getCurrencySign(instrument!.currency)}`,
                      `${tTreemap(['lastPrice'])}: ${formatCurrency(quote!.last_price, instrument!.currency)}`
                    ]
                  };
                })
              );
          })
        );
    }

    this.newTooltip$.next(tooltipModel);
    return this.tooltipData$;
  }

  private selectInstrument(symbol: string): void {
    this.settingsService.getSettings(this.guid)
      .pipe(
        take(1),
      )
      .subscribe(s => {
        this.dashboardContextService.selectDashboardInstrument({
            exchange: this.defaultExchange,
            symbol
          },
          s.badgeColor!);
      });
  }
}
