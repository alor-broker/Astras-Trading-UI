import {
  Component, DestroyRef,
  Input,
  OnInit
} from '@angular/core';
import {
  BodyRow,
  CurrentOrderDisplay,
  ScalperOrderBookRowType,
} from '../../models/scalper-order-book.model';
import {
  combineLatest,
  filter,
  Observable,
  Subject
} from 'rxjs';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { map } from 'rxjs/operators';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { Side } from '../../../../shared/models/enums/side.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeSettings } from '../../../../shared/models/settings/theme-settings.model';
import { ScalperCommandProcessorService } from '../../services/scalper-command-processor.service';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { ScalperOrdersService } from '../../services/scalper-orders.service';
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

interface VolumeHighlightArguments {
  rowType: ScalperOrderBookRowType;
  volume: number;
  maxVolume: number;
}

type VolumeHighlightStrategy = (args: VolumeHighlightArguments) => any | null;

interface DisplayRow extends BodyRow {
  currentOrders: CurrentOrderDisplay[];
  getVolumeStyle: () => any;
}

@Component({
  selector: 'ats-scalper-order-book-table',
  templateUrl: './scalper-order-book-table.component.html',
  styleUrls: ['./scalper-order-book-table.component.less']
})
export class ScalperOrderBookTableComponent implements OnInit {
  readonly numberFormats = NumberDisplayFormat;

  ordersSides = Side;
  @Input({required: true})
  rowHeight!: number;
  displayItems$!: Observable<DisplayRow[]>;
  @Input({required: true})
  dataContext!: ScalperOrderBookDataContext;

  @Input()
  isActive: boolean = false;

  readonly hoveredRow$ = new Subject<{ price: number } | null>();

  constructor(
    private readonly scalperOrdersService: ScalperOrdersService,
    private readonly themeService: ThemeService,
    private readonly commandProcessorService: ScalperCommandProcessorService,
    private readonly hotkeysService: HotKeyCommandService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  getPriceCellClasses(row: BodyRow): any {
    return {
      ...this.getVolumeCellClasses(row),
      'current-position-range-item': !!row.currentPositionRangeSign,
      'positive': row.currentPositionRangeSign! > 0,
      'negative': row.currentPositionRangeSign! < 0
    };
  }

  getVolumeCellClasses(row: BodyRow): any {
    return {
      ...this.getOrdersCellClasses(row),
      'spread-item': row.rowType === ScalperOrderBookRowType.Spread
    };
  }

  getOrdersCellClasses(row: BodyRow): any {
    return {
      'trade-item': (row.volume ?? 0) > 0,
      'ask-side-item': row.rowType === ScalperOrderBookRowType.Ask,
      'bid-side-item': row.rowType === ScalperOrderBookRowType.Bid,
      'spread-item': row.rowType === ScalperOrderBookRowType.Spread,
      'best-row': row.isBest
    };
  }

  getTrackKey(index: number): number {
    return index;
  }

  ngOnInit(): void {
    this.initDisplayItems();
    this.subscribeToHotkeys();
  }

  getFilteredOrders(orders: CurrentOrderDisplay[], type: 'limit' | 'stoplimit' | 'stop'): {
    orders: CurrentOrderDisplay[],
    volume: number
  } {
    const limitOrders = orders.filter(x => x.type === type);

    return {
      orders: limitOrders,
      volume: limitOrders.reduce((previousValue, currentValue) => previousValue + currentValue.displayVolume, 0)
    };
  }

  cancelOrders(e: MouseEvent, orders: CurrentOrderDisplay[]) {
    e?.preventDefault();
    e?.stopPropagation();

    if (orders.length > 0) {
      this.scalperOrdersService.cancelOrders(orders);
    }
  }

  leftMouseClick(e: MouseEvent, row: DisplayRow) {
    e.preventDefault();
    e.stopPropagation();
    document.getSelection()?.removeAllRanges();

    this.commandProcessorService.processLeftMouseClick(e, row, this.dataContext);
  }

  rightMouseClick(e: MouseEvent, row: DisplayRow) {
    e.preventDefault();
    e.stopPropagation();
    document.getSelection()?.removeAllRanges();

    this.commandProcessorService.processRightMouseClick(e, row, this.dataContext);
  }

  updateOrderPrice(orders: CurrentOrderDisplay[], row: DisplayRow) {
    this.commandProcessorService.updateOrdersPrice(orders, row, this.dataContext);
  }

  updateHoveredItem(hoveredItem: { price: number } | null) {
    this.hoveredRow$.next(hoveredItem);
  }

  private initDisplayItems() {
    this.displayItems$ = combineLatest([
      this.dataContext.extendedSettings$,
      this.dataContext.orderBookBody$,
      this.dataContext.orderBookData$,
      this.dataContext.displayRange$,
      this.dataContext.currentOrders$,
      this.themeService.getThemeSettings()
    ]).pipe(
      filter(([, , displayRange, , ,]) => !!displayRange),
      map(([settings, body, orderBookData, displayRange, currentOrders, themeSettings]) => {
        const displayRows = body.slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));
        const minOrderPrice = Math.min(...currentOrders.map(x => x.linkedPrice));
        const maxOrderPrice = Math.max(...currentOrders.map(x => x.linkedPrice));
        const volumeHighlightStrategy = this.getVolumeHighlightStrategy(settings.widgetSettings, themeSettings);
        const maxOrderBookVolume = settings.widgetSettings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume
          ? Math.max(...[...orderBookData.a, ...orderBookData.b].map(x => x.v))
          : 0;

        return displayRows.map(row => {
          const displayRow = {
            ...row,
            currentOrders: [],
            getVolumeStyle: () => volumeHighlightStrategy({
              rowType: row.rowType!,
              volume: row.volume ?? 0,
              maxVolume: maxOrderBookVolume
            })

          } as DisplayRow;

          if (row.price >= minOrderPrice && row.price <= maxOrderPrice) {
            displayRow.currentOrders = currentOrders.filter(x => x.linkedPrice === row.price);
          }

          return displayRow;
        });
      })
    );
  }

  private subscribeToHotkeys() {
    this.dataContext.extendedSettings$.pipe(
      mapWith(
        () => this.hotkeysService.commands$,
        (settings, command) => ({ settings, command })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ settings, command }) => {
      if (settings.widgetSettings.disableHotkeys) {
        return;
      }

      this.commandProcessorService.processHotkeyPress(command, this.isActive, this.dataContext);
    });
  }

  private getVolumeHighlightStrategy(settings: ScalperOrderBookSettings, themeSettings: ThemeSettings): VolumeHighlightStrategy {
    if (settings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume) {
      return this.createBiggestVolumeHighlightStrategy(themeSettings);
    }

    if (settings.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue) {
      return this.volumeBoundsWithFixedValueStrategy(settings);
    }

    return () => null;
  }

  private createBiggestVolumeHighlightStrategy(themeSettings: ThemeSettings): VolumeHighlightStrategy {
    return (args: VolumeHighlightArguments) => {
      if (args.rowType !== ScalperOrderBookRowType.Ask && args.rowType !== ScalperOrderBookRowType.Bid || !args.volume) {
        return null;
      }

      const size = 100 * (args.volume / args.maxVolume);
      const color = args.rowType === ScalperOrderBookRowType.Bid
        ? themeSettings.themeColors.buyColorBackground
        : themeSettings.themeColors.sellColorBackground;

      return {
        background: `linear-gradient(90deg, ${color} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    };
  }

  private volumeBoundsWithFixedValueStrategy(settings: ScalperOrderBookSettings): VolumeHighlightStrategy {
    return (args: VolumeHighlightArguments) => {
      if (args.rowType !== ScalperOrderBookRowType.Ask && args.rowType !== ScalperOrderBookRowType.Bid || !args.volume) {
        return null;
      }

      let size = 0;
      const volumeHighlightOption = this.getVolumeHighlightOption(settings, args.volume);
      if (!volumeHighlightOption) {
        return null;
      }

      if (!!settings.volumeHighlightFullness) {
        size = 100 * (args.volume / settings.volumeHighlightFullness);
        if (size > 100) {
          size = 100;
        }
      }

      return {
        background: `linear-gradient(90deg, ${volumeHighlightOption.color}BF ${size}% , rgba(0,0,0,0) ${size}%)`
      };
    };
  }

  private getVolumeHighlightOption(settings: ScalperOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => b.boundary - a.boundary)
      .find(x => volume >= x.boundary);
  }

}
