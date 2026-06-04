import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  filter,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import {
  map,
  startWith
} from 'rxjs/operators';
import {color} from "d3-color";
import {LetDirective} from '@ngrx/component';
import {toObservable} from "@angular/core/rxjs-interop";
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {
  TradesClusterHighlightMode,
  TradesClusterPanelSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {TradesCluster as TradesClusterType} from '../../types/trades-clusters.types';
import {RULER_CONTEX} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book-body/scalper-order-book-body';

interface DisplayItem {
  volume: number | null;
  buyQty: number;
  sellQty: number;
  isMaxVolume: boolean;
  isMajorLinePrice: boolean;
  isMinorLinePrice: boolean;
  mappedPrice: number;
}

type CssStyleMap = Record<string, string | number | null | undefined>;

@Component({
  selector: 'ats-trades-cluster',
  templateUrl: './trades-cluster.html',
  styleUrls: ['./trades-cluster.less'],
  imports: [
    LetDirective,
    ShortNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TradesCluster implements OnInit {
  readonly numberFormats = NumberDisplayFormat;

  readonly xAxisStep = input.required<number>();

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  displayItems$!: Observable<(DisplayItem)[]>;

  settings$!: Observable<ScalperOrderBookExtendedSettings>;

  readonly cluster = input<TradesClusterType>();

  private readonly themeService = inject(ThemeService);

  readonly themeColors$ = this.themeService.getThemeSettings().pipe(
    map(t => t.themeColors)
  );

  private readonly rulerContext = inject(RULER_CONTEX, {skipSelf: true, optional: true});

  hoveredPriceRow$: Observable<{ price: number } | null> = this.rulerContext?.hoveredRow$ ?? of(null);

  private readonly clusterChanges$ = toObservable(this.cluster).pipe(
    startWith(null),
    shareReplay(1)
  );

  ngOnInit(): void {
    this.settings$ = this.dataContext().extendedSettings$;

    this.displayItems$ = combineLatest([
      this.dataContext().orderBookBody$,
      this.dataContext().displayRange$,
      this.clusterChanges$
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
            {buyQty: 0, sellQty: 0}
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
    themeColors: ThemeColors): CssStyleMap | null {
    if (settings == null) {
      return null;
    }

    switch (settings.highlightMode ?? TradesClusterHighlightMode.Off) {
      case TradesClusterHighlightMode.BuySellDominance:
        return this.getClusterBuySellDominanceStyle(item, themeColors);
      case TradesClusterHighlightMode.TargetVolume:
        return this.getClusterTargetVolumeStyle(item, settings.targetVolume ?? null, themeColors);
      case TradesClusterHighlightMode.BuyVsSell:
        return this.getClusterBuyVsSellStyle(item, themeColors);
      default:
        return null;
    }
  }

  private getClusterBuySellDominanceStyle(
    item: DisplayItem,
    themeColors: ThemeColors
  ): CssStyleMap | null {
    if (
      item.volume == null
      || item.volume === 0
    ) {
      return null;
    }

    let itemsColor: string | null = null;
    let percent = 0;
    if (item.buyQty > item.sellQty) {
      itemsColor = themeColors.buyColor;
      percent = item.buyQty / item.volume;
    } else if (item.sellQty > item.buyQty) {
      itemsColor = themeColors.sellColor;
      percent = item.sellQty / item.volume;
    }

    if (itemsColor == null) {
      return null;
    }

    percent = Math.min(1, MathHelper.round(percent, 2));

    const d3Color = color(itemsColor);
    if (d3Color == null) {
      return null;
    }

    if (percent > 0.75) {
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
  ): CssStyleMap | null {
    if (
      item.volume == null
      || item.volume === 0
      || targetVolume == null
    ) {
      return null;
    }

    let itemColor = themeColors.mixColor;

    if (item.buyQty > item.sellQty) {
      itemColor = themeColors.buyColor;
    }

    if (item.buyQty < item.sellQty) {
      itemColor = themeColors.sellColor;
    }

    const d3Color = color(itemColor);
    if (d3Color == null) {
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

  private getClusterBuyVsSellStyle(
    item: DisplayItem,
    themeColors: ThemeColors
  ): CssStyleMap | null {
    if (
      item.volume == null
      || item.volume === 0
    ) {
      return null;
    }

    const d3BuyColor = color(themeColors.buyColor);
    const d3SellColor = color(themeColors.sellColor);

    if (d3BuyColor == null || d3SellColor == null) {
      return null;
    }

    d3BuyColor.opacity = d3SellColor.opacity = 0.5;

    const buyVolumePercent = Math.round((item.buyQty / item.volume) * 100);

    return {
      'background': `linear-gradient(90deg, ${d3BuyColor.formatRgb()} ${buyVolumePercent}%, ${d3SellColor.formatRgb()} ${buyVolumePercent}%)`,
      'width': '100%'
    };
  }
}
