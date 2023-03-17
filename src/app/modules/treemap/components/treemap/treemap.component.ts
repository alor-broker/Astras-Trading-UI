import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { ActiveElement, Chart, ChartEvent } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { TreemapService } from "../../services/treemap.service";
import { map } from "rxjs/operators";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ThemeService } from "../../../../shared/services/theme.service";
import { maxDayChange, TreemapNode } from "../../models/treemap.model";
import { BehaviorSubject, Observable } from "rxjs";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { TranslatorService } from "../../../../shared/services/translator.service";

@Component({
  selector: 'ats-treemap',
  templateUrl: './treemap.component.html',
  styleUrls: ['./treemap.component.less']
})
export class TreemapComponent implements AfterViewInit, OnInit {
  @Input() guid!: string;
  ctx!: CanvasRenderingContext2D;
  selectedSector$ = new BehaviorSubject('');
  chart!: Chart;
  isCursorOnSector$ = new BehaviorSubject(false);

  constructor(
    private readonly treemapService: TreemapService,
    private readonly themeService: ThemeService,
    private readonly quotesService: QuotesService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit() {
    Chart.register(TreemapController, TreemapElement);
  }

  ngAfterViewInit() {
    this.ctx = (<HTMLCanvasElement>document.getElementById(this.guid)).getContext('2d')!;

    this.treemapService.getTreemap()
      .pipe(
        mapWith(
          () => this.selectedSector$,
          (treemap, sector) => ({ treemap, sector })
        ),
        map(({ treemap, sector }) => treemap
          .map(t => ({
            ...t,
            dayChangeAbs: Math.abs(t.dayChange)
          }))
          .filter(t => t.sector.includes(sector))
        ),
        mapWith(
          () => this.themeService.getThemeSettings(),
          (treemap, theme) => ({ treemap, themeColors: theme.themeColors })
          )
      )
      .subscribe(({ treemap, themeColors }) => {
        this.chart?.clear();
        this.chart?.destroy();

        this.chart = new Chart(this.ctx, {
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
                  formatter: (t: any) => [ t.raw._data.symbol, t.raw._data.children[0]?.dayChange + '%' ],
                  overflow: 'fit',
                  color: themeColors.chartLabelsColor,
                  font: [{ weight: '600' }, { weight: '400' }]
                },
                backgroundColor: (t: any) => {
                  if (t.raw?._data.label === t.raw?._data.sector) {
                    return themeColors.treemapBackground;
                  } else {
                    return t.raw._data.children[0]?.dayChange > 0
                      ? themeColors.buyColor.replace('1)', `${t.raw._data.children[0]?.dayChangeAbs / maxDayChange})`)
                      : themeColors.sellColor.replace('1)', `${t.raw._data.children[0]?.dayChangeAbs / maxDayChange})`);
                  }
                },
                borderRadius: 4
              } as any
            ],
          },
          options: {
            onHover: (event: ChartEvent, elements: ActiveElement[]) => {
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
                  title(tooltipItems: any) {
                    return tooltipItems.length > 1
                      ? tooltipItems[1]!.raw._data.label
                      : tooltipItems[0]!.raw._data.label;
                  }
                }
              },
            },
            onClick: (event: ChartEvent, elements: ActiveElement[]) => {
              if (elements.length === 1) {
                if (this.selectedSector$.getValue()) {
                  setTimeout(() => this.selectedSector$.next(''), 0);
                } else {
                  setTimeout(() => this.selectedSector$.next((<any>elements[0].element).$context.raw.g), 0);
                }
              }
            }
          }
        });
      });
  }

  private getTooltipLabel = (tooltipItem: any): any => {
    const treemapNode = tooltipItem.raw._data;

    if (treemapNode.label === treemapNode.sector) {
      return '';
    }

    this.getTooltipData(treemapNode.children[0])
      .subscribe(data => {
        this.chart.options.plugins!.tooltip!.callbacks!.label = (newTooltipItem: any): any => {
          if (newTooltipItem.raw._data.label === newTooltipItem.raw._data.sector) {
            return '';
          }

          if (newTooltipItem.raw._data.label === treemapNode.label) {
            return data;
          } else {
            this.getTooltipLabel(newTooltipItem);
          }
        };
        this.chart.update();
      });
  };

  private getTooltipData(treemapNode: TreemapNode): Observable<string[]> {
    return this.quotesService.getLastQuoteInfo(treemapNode.symbol, 'MOEX')
      .pipe(
        mapWith(
          () => this.translatorService.getTranslator('treemap'),
          (quote, t) => ({quote, t})
        ),
        map(({ quote, t }) => ([
          `${t(['company'])}: ${quote?.description}`,
          `${t(['dayChange'])}: ${treemapNode.dayChange}%`,
          `${t(['marketCap'])}: ${treemapNode.marketCap}`,
          `${t(['lastPrice'])}: ${quote?.last_price}`
        ]))
      );
  }
}