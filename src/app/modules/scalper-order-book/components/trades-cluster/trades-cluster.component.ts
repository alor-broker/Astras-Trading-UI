import {Component, Inject, Input, OnDestroy, OnInit, Optional, SkipSelf} from '@angular/core';
import {TradesCluster} from '../../models/trades-clusters.model';
import {BehaviorSubject, combineLatest, filter, Observable, of} from 'rxjs';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {map} from 'rxjs/operators';
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {RULER_CONTEX, RulerContext} from "../scalper-order-book-body/scalper-order-book-body.component";
import {TradesClusterHighlightMode, TradesClusterPanelSettings} from "../../models/scalper-order-book-settings.model";
import {ThemeService} from "../../../../shared/services/theme.service";
import {ThemeColors} from "../../../../shared/models/settings/theme-settings.model";
import {color} from "d3";
import {MathHelper} from "../../../../shared/utils/math-helper";

interface DisplayItem {
  volume: number | null;
  buyQty: number;
  sellQty: number;
  isMaxVolume: boolean;
  isMajorLinePrice: boolean;
  isMinorLinePrice: boolean;
  mappedPrice: number;
}

@Component({
  selector: 'ats-trades-cluster',
  templateUrl: './trades-cluster.component.html',
  styleUrls: ['./trades-cluster.component.less']
})
export class TradesClusterComponent implements OnInit, OnDestroy {
  readonly numberFormats = NumberDisplayFormat;

  @Input({ required: true })
  xAxisStep!: number;

  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  displayItems$!: Observable<(DisplayItem)[]>;
  settings$!: Observable<ScalperOrderBookExtendedSettings>;
  private readonly currentCluster$ = new BehaviorSubject<TradesCluster | null>(null);
  hoveredPriceRow$: Observable<{ price: number } | null> = this.rulerContext?.hoveredRow$ ?? of(null);

  readonly themeColors$ = this.themeService.getThemeSettings().pipe(
    map(t => t.themeColors)
  );

  constructor(
    private readonly themeService: ThemeService,
    @Inject(RULER_CONTEX)
    @SkipSelf()
    @Optional()
    private readonly rulerContext?: RulerContext,
    ) {
  }

  @Input()
  set cluster(value: TradesCluster) {
    this.currentCluster$.next(value);
  }

  ngOnDestroy(): void {
    this.currentCluster$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.dataContext.extendedSettings$;

    this.displayItems$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$,
      this.currentCluster$
    ]).pipe(
      filter(([, displayRange]) => !!displayRange),
      map(([body, displayRange, currentCluster]) => {
        const displayRows = body.slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));

        let maxVolume = 0;
        const mappedRows = displayRows.map(r => {
          const displayRow = {
            volume: null,
            buyQty: 0,
            sellQty: 0,
            isMaxVolume: false,
            isMajorLinePrice: r.isMajorLinePrice,
            isMinorLinePrice: r.isMinorLinePrice,
            mappedPrice: r.price
          };

          if (!currentCluster) {
            return displayRow;
          }

          const mappedItems = currentCluster.tradeClusters.filter(c => c.price >= r.baseRange.min && c.price <= r.baseRange.max);
          if (mappedItems.length === 0) {
            return displayRow;
          }

          const itemVolume = mappedItems.reduce(
            (agg, curr) => ({
              buyQty: agg.buyQty + curr.buyQty,
              sellQty: agg.sellQty + curr.sellQty,
            }),
            { buyQty: 0, sellQty: 0 }
          );

          const totalBuyQty = Math.round(itemVolume.buyQty);
          const totalSellQty = Math.round(itemVolume.sellQty);
          const totalVolume = Math.round(itemVolume.buyQty + itemVolume.sellQty);

          maxVolume = Math.max(maxVolume, totalVolume);

          return {
            ...displayRow,
            volume: totalVolume,
            buyQty: totalBuyQty,
            sellQty: totalSellQty
          };
        });

        mappedRows.forEach(r => {
          if (r !== null) {
            r.isMaxVolume = r.volume === maxVolume;
          }
        });

        return mappedRows;
      })
    );
  }

  isRulerHovered(item: DisplayItem, hoveredPriceRow: { price: number } | null): boolean {
    return item.mappedPrice === hoveredPriceRow?.price;
  }

  getClusterItemHighlightStyle(
    item: DisplayItem,
    settings: TradesClusterPanelSettings | null,
    themeColors: ThemeColors): any | null {
    if(settings == null) {
      return null;
    }

    switch (settings.highlightMode ?? TradesClusterHighlightMode.Off) {
      case TradesClusterHighlightMode.BuySellDominance:
        return this.getClusterBuySellDominanceStyle(item, themeColors);
      case TradesClusterHighlightMode.TargetVolume:
        return this.getClusterTargetVolumeStyle(item, settings.targetVolume ?? null, themeColors);
      default:
        return null;
    }
  }

  private getClusterBuySellDominanceStyle(
    item: DisplayItem,
    themeColors: ThemeColors
  ): any | null {
    if(
      item.volume == null
      || item.volume === 0
    ) {
      return null;
    }

    let itemsColor: string | null = null;
    let percent = 0;
    if(item.buyQty > item.sellQty) {
      itemsColor = themeColors.buyColor;
      percent = item.buyQty / item.volume;
    } else if(item.sellQty > item.buyQty) {
      itemsColor = themeColors.sellColor;
      percent = item.sellQty / item.volume;
    }

    if(itemsColor == null) {
      return null;
    }

    percent = Math.min(1, MathHelper.round(percent, 2));

    const d3Color = color(itemsColor);
    if(d3Color == null) {
      return null;
    }

    if(percent > 0.75) {
      d3Color.opacity = 0.8;
    } else {
      d3Color.opacity = percent - 0.25;
    }

    return {
      'background-color': d3Color.formatRgb(),
      'width': '100%'
    };
  }

  private getClusterTargetVolumeStyle(
    item: DisplayItem,
    targetVolume: number | null,
    themeColors: ThemeColors
  ): any | null {
    if(
      item.volume == null
      || item.volume === 0
      || targetVolume == null
    ) {
      return null;
    }

    let itemColor = themeColors.mixColor;

    if(item.buyQty > item.sellQty) {
      itemColor = themeColors.buyColor;
    }

    if(item.buyQty < item.sellQty) {
      itemColor = themeColors.sellColor;
    }

    const d3Color = color(itemColor);
    if(d3Color == null) {
      return null;
    }

    d3Color.opacity = 0.5;

    const percent = Math.min(
      100,
      Math.round((item.volume / targetVolume) * 100)
    );

    return {
      'background-color': d3Color.formatRgb(),
      'width': `${percent}%`
    };
  }
}
