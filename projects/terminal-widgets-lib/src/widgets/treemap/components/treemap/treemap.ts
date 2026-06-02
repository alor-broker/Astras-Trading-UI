import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  zip
} from "rxjs";
import {WidgetSettingsService} from "@terminal-core-lib/features/widget-settings/services/widget-settings.service";
import {ApplicationStatusService} from "@terminal-core-lib/common/services/application-status.service";
import {
  ActiveElement,
  Chart,
  ChartEvent
} from "chart.js/auto";
import {MarketService} from "@terminal-core-lib/features/market-config/market.service";
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {TreemapWidgetSettings} from '@terminal-widgets-lib/widgets/treemap/widget-settings.types';
import {
  TreemapController,
  TreemapElement
} from "chartjs-chart-treemap";
import {TreemapNode} from "../../services/treemap-service.types";
import {TreemapService} from "../../services/treemap.service";
import {ThemeService} from "@terminal-core-lib/features/themes/services/theme.service";
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  AsyncPipe,
  formatNumber
} from '@angular/common';
import {color} from "d3-color";
import {NumberAbbreviationHelper} from '@terminal-core-lib/common/utils/number-abbreviation.helper';
import {CurrencyFormatHelper} from '@terminal-core-lib/common/utils/currency-format.helper';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';

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
  position: {
    top: number;
    left: number;
  };
}

@Component({
  selector: 'ats-treemap',
  imports: [
    AsyncPipe
  ],
  templateUrl: './treemap.html',
  styleUrl: './treemap.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Treemap implements AfterViewInit, OnInit, OnDestroy {
  readonly treemapWrapperEl = viewChild<ElementRef<HTMLDivElement>>('treemapWrapper');

  readonly guid = input.required<string>();

  isCursorOnSector$ = new BehaviorSubject(false);

  tooltipData$?: Observable<TooltipData | null>;

  isTooltipVisible$ = new BehaviorSubject(true);

  private readonly treemapService = inject(TreemapService);

  private readonly themeService = inject(ThemeService);

  private readonly quotesService = inject(QuotesService);

  private readonly translatorService = inject(TranslatorService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly marketService = inject(MarketService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroy = inject(DestroyRef);

  private readonly locale = inject(LOCALE_ID);

  // this widget works  with MOEX exchange only
  private readonly defaultExchange = 'MOEX';

  private chart?: Chart;

  private readonly selectedSector$ = new BehaviorSubject('');

  private readonly tilesCount$ = new BehaviorSubject(0);

  private readonly maxDayChange = 5;

  private readonly averageTileSize = 4000;

  private readonly newTooltip$ = new BehaviorSubject<TooltipModelRaw[] | null>(null);

  private settings$!: Observable<TreemapWidgetSettings>;

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<TreemapWidgetSettings>(this.guid()).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );

    Chart.register(TreemapController, TreemapElement);
    this.initTooltipDataStream();
  }

  ngAfterViewInit(): void {
    this.tilesCount$.next(
      Math.floor(this.treemapWrapperEl()!.nativeElement.clientWidth * this.treemapWrapperEl()!.nativeElement.clientHeight / this.averageTileSize)
    );

    const getDataStream = (limit: number): Observable<TreemapNode[]> => {
      return this.settings$.pipe(
        switchMap(s => createRefresh((s.refreshIntervalSec ?? 60) * 1000, this.applicationStatusService.isActive$)),
        switchMap(() => this.treemapService.getTreemap(limit))
      );
    };

    const treemap$ = this.tilesCount$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(limit => getDataStream(limit)),
      startWith([])
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
        takeUntilDestroyed(this.destroy)
      )
      .subscribe(({treemap, themeColors}) => {
        const ctx = (<HTMLCanvasElement>document.getElementById(this.guid())).getContext('2d');

        if (ctx == null) {
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
                  font: {weight: '500'}
                },
                labels: {
                  display: true,
                  formatter: (t: any) => [t.raw._data.symbol, `${formatNumber(t.raw._data.children[0]?.dayChange, this.locale, '1.1-2')}%`] as string[],
                  overflow: 'fit',
                  color: themeColors.textColor,
                  font: [{weight: '500'}, {weight: '400'}]
                },
                backgroundColor: (t: any) => {
                  if (t.raw?._data.label === t.raw?._data.sector) {
                    return themeColors.chartShadow;
                  } else {
                    const c = t.raw._data.children[0]?.dayChange > 0
                      ? color(themeColors.buyColor)
                      : color(themeColors.sellColor);

                    if (c) {
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
            onResize: (chart: Chart, {width, height}: { width: number, height: number }): void => {
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
                position: 'nearest',
                external: ({tooltip}: { tooltip: any }): void => {
                  // Hide if no tooltip
                  if (tooltip.opacity === 0) {
                    this.isTooltipVisible$.next(false);
                    return;
                  } else {
                    this.isTooltipVisible$.next(true);
                  }

                  this.newTooltip$.next(tooltip.dataPoints.map((dp: any) => dp.raw as TooltipModelRaw));
                },
                enabled: false
              },
            },
            onClick: (event: ChartEvent, elements: ActiveElement[]): void => {
              if (elements.length === 1) {
                this.selectedSector$
                  .pipe(
                    take(1)
                  )
                  .subscribe(sector => {
                    setTimeout(() => {
                      if (sector) {
                        this.selectedSector$.next('');
                      } else {
                        this.selectedSector$.next((<any>elements[0].element).$context.raw.g);
                      }
                    }, 0);
                  });
              }

              if (elements.length > 1) {
                this.selectInstrument((<any>elements[1].element).$context.raw.g);
              }
            }
          }
        } as any);
      });
  }

  ngOnDestroy(): void {
    this.selectedSector$.complete();
    this.isCursorOnSector$.complete();
    this.newTooltip$.complete();
  }

  getMinValue(...args: number[]): number {
    return Math.min(...args);
  }

  private initTooltipDataStream(): void {
    this.tooltipData$ ??= this.newTooltip$
      .pipe(
        takeUntilDestroyed(this.destroy),
        filter((tr): tr is TooltipModelRaw[] => tr != null && tr.length > 0),
        debounceTime(50),
        switchMap((tooltipRaws: TooltipModelRaw[]) => {
          if (this.chart == null) {
            return of(null);
          }

          const position = {
            top: this.chart.tooltip!.caretY,
            left: this.chart.tooltip!.caretX
          };

          if (tooltipRaws.length === 1) {
            return of({
              body: [],
              title: tooltipRaws[0]._data.label,
              position
            });
          }

          const treemapNode = tooltipRaws[1]._data.children[0];

          return zip(
            this.quotesService.getLastQuoteInfo(treemapNode.symbol, this.defaultExchange),
            this.translatorService.getTranslator('treemap'),
            this.translatorService.getTranslator('shared/short-number'),
            this.instrumentsService.getInstrument({exchange: this.defaultExchange, symbol: treemapNode.symbol}),
            this.marketService.getMarketSettings()
          )
            .pipe(
              map(([quote, tTreemap, tShortNumber, instrument, marketSettings]) => {
                const marketCapBase = NumberAbbreviationHelper.getNumberAbbreviation(treemapNode.marketCap, true);
                const curencyFormat = CurrencyFormatHelper.getCurrencyFormat(instrument!.currency, marketSettings.currencies);
                return {
                  title: treemapNode.symbol,
                  body: [
                    `${tTreemap(['company'])}: ${quote?.description}`,
                    `${tTreemap(['dayChange'])}: ${formatNumber(treemapNode.dayChange, this.locale, '1.1-2')}%`,
                    `${tTreemap(['marketCap'])}: ${formatNumber(marketCapBase!.value, this.locale, '1.1-2')} ${tShortNumber([
                      marketCapBase!.suffixName!,
                      'long'
                    ])} ${CurrencyFormatHelper.getCurrencySign(curencyFormat)}`,
                    `${tTreemap(['lastPrice'])}: ${CurrencyFormatHelper.formatCurrency(quote!.last_price, this.locale, curencyFormat)}`
                  ],
                  position
                };
              })
            );
        })
      );
  }

  private selectInstrument(symbol: string): void {
    this.settings$.pipe(
      take(1),
    )
      .subscribe(s => {
        this.actionsContext.selectInstrument({
            exchange: this.defaultExchange,
            symbol
          },
          s.badgeColor!);
      });
  }
}
