import { Component, input, OnInit, inject } from '@angular/core';
import {TradesCluster} from '../../models/trades-clusters.model';
import {combineLatest, filter, Observable, of, shareReplay} from 'rxjs';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {map, startWith} from 'rxjs/operators';
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {RULER_CONTEX, RulerContext} from "../scalper-order-book-body/scalper-order-book-body.component";
import {TradesClusterHighlightMode, TradesClusterPanelSettings} from "../../models/scalper-order-book-settings.model";
import {ThemeService} from "../../../../shared/services/theme.service";
import {ThemeColors} from "../../../../shared/models/settings/theme-settings.model";
import {color} from "d3";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {LetDirective} from '@ngrx/component';
import {NgClass, NgStyle} from '@angular/common';
import {ShortNumberComponent} from '../../../../shared/components/short-number/short-number.component';
import {toObservable} from "@angular/core/rxjs-interop";

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
  styleUrls: ['./trades-cluster.component.less'],
  imports: [
    LetDirective,
    NgClass,
    NgStyle,
    ShortNumberComponent
  ]
})
export class TradesClusterComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly rulerContext = inject<RulerContext>(RULER_CONTEX, { skipSelf: true, optional: true });

  readonly numberFormats = NumberDisplayFormat;

  readonly xAxisStep = input.required<number>();

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  displayItems$!: Observable<(DisplayItem)[]>;
  settings$!: Observable<ScalperOrderBookExtendedSettings>;
  hoveredPriceRow$: Observable<{ price: number } | null> = this.rulerContext?.hoveredRow$ ?? of(null);

  readonly themeColors$ = this.themeService.getThemeSettings().pipe(
    map(t => t.themeColors)
  );

  readonly cluster = input<TradesCluster>();

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
    themeColors: ThemeColors): any | null {
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
  ): any | null {
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
  ): any | null {
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
  ): any | null {
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
