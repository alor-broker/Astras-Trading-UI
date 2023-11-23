import {
  AfterViewInit,
  Component,
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
  TooltipItem
} from "chart.js";
import {
  TreemapController,
  TreemapElement
} from "chartjs-chart-treemap";
import { TreemapService } from "../../services/treemap.service";
import {
  debounceTime,
  map,
  switchMap
} from "rxjs/operators";
import { ThemeService } from "../../../../shared/services/theme.service";
import { TreemapNode } from "../../models/treemap.model";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
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

@Component({
  selector: 'ats-treemap',
  templateUrl: './treemap.component.html',
  styleUrls: ['./treemap.component.less']
})
export class TreemapComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('treemapWrapper') treemapWrapperEl?: ElementRef;
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

  constructor(
    private readonly treemapService: TreemapService,
    private readonly themeService: ThemeService,
    private readonly quotesService: QuotesService,
    private readonly translatorService: TranslatorService,
    private readonly instrumentsService: InstrumentsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService
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
                displayColors: false,
                callbacks: {
                  label: this.getTooltipLabel,
                  title(tooltipItems: TooltipItem<'treemap'>[]): string {
                    return (tooltipItems.length > 1
                      ? (tooltipItems[1]!.raw as any)._data.label
                      : (tooltipItems[0]!.raw as any)._data.label) as string;
                  }
                },
                animation: {
                  duration: 100
                }
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
  }

  private readonly getTooltipLabel = (tooltipItem: TooltipItem<'treemap'>): string | void => {
    const treemapNode = (tooltipItem.raw as any)._data as { label: string, sector: string, children: TreemapNode[]};

    if (treemapNode.label === treemapNode.sector) {
      return '';
    }

    this.getTooltipData(treemapNode.children[0])
      .pipe(
        take(1)
      )
      .subscribe(data => {
        this.chart!.options.plugins!.tooltip!.callbacks!.label = (newTooltipItem: any): any => {
          if (newTooltipItem.raw._data.label === newTooltipItem.raw._data.sector) {
            return '';
          }

          if (newTooltipItem.raw._data.label === treemapNode.label) {
            return data;
          } else {
            this.getTooltipLabel(newTooltipItem);
          }
        };
        this.chart!.update();
      });
  };

  private getTooltipData(treemapNode: TreemapNode): Observable<string[]> {
    return this.quotesService.getLastQuoteInfo(treemapNode.symbol, this.defaultExchange)
      .pipe(
        withLatestFrom(
          this.translatorService.getTranslator('treemap'),
          this.translatorService.getTranslator('shared/short-number'),
          this.instrumentsService.getInstrument({ exchange: this.defaultExchange, symbol: treemapNode.symbol })
        ),
        map(([quote, tTreemap, tShortNumber, instrument]) => {
          const marketCapBase = getNumberAbbreviation(treemapNode.marketCap, true);
          return [
            `${tTreemap(['company'])}: ${quote?.description}`,
            `${tTreemap(['dayChange'])}: ${treemapNode.dayChange}%`,
            `${tTreemap(['marketCap'])}: ${marketCapBase!.value}${tShortNumber([
              marketCapBase!.suffixName!,
              'long'
            ])} ${getCurrencySign(instrument!.currency)}`,
            `${tTreemap(['lastPrice'])}: ${formatCurrency(quote!.last_price, instrument!.currency)}`
          ];
        })
      );
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
