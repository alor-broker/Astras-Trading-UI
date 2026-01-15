import { Component, DestroyRef, input, OnInit, inject } from '@angular/core';
import {BodyRow, CurrentOrderDisplay, ScalperOrderBookRowType,} from '../../models/scalper-order-book.model';
import {combineLatest, Observable,} from 'rxjs';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {map} from 'rxjs/operators';
import {mapWith} from '../../../../shared/utils/observable-helper';
import {Side} from '../../../../shared/models/enums/side.model';
import {ThemeService} from '../../../../shared/services/theme.service';
import {ThemeSettings} from '../../../../shared/models/settings/theme-settings.model';
import {ScalperCommandProcessorService} from '../../services/scalper-command-processor.service';
import {
  ScalperOrderBookWidgetSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '../../models/scalper-order-book-settings.model';
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {color} from "d3";
import {OrderType} from "../../../../shared/models/orders/order.model";
import {CancelOrdersCommand} from "../../commands/cancel-orders-command";
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {RULER_CONTEX, RulerContext,} from "../scalper-order-book-body/scalper-order-book-body.component";
import {ActiveOrderBookHotKeysTypes} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {TableRulerComponent} from '../table-ruler/table-ruler.component';
import {HoverItemsGroupDirective} from '../../directives/hover-items-group.directive';
import {HoverItemDirective} from '../../directives/hover-item.directive';
import {AsyncPipe, NgClass, NgStyle, NgTemplateOutlet} from '@angular/common';
import {ShortNumberComponent} from '../../../../shared/components/short-number/short-number.component';
import {CdkDrag, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {LetDirective} from '@ngrx/component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AtsPricePipe} from '../../../../shared/pipes/ats-price.pipe';

interface VolumeHighlightArguments {
  rowType: ScalperOrderBookRowType;
  askVolume: number;
  bidVolume: number;
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
  styleUrls: ['./scalper-order-book-table.component.less'],
  imports: [
    TranslocoDirective,
    TableRulerComponent,
    HoverItemsGroupDirective,
    HoverItemDirective,
    NgClass,
    NgStyle,
    NgTemplateOutlet,
    ShortNumberComponent,
    CdkDropListGroup,
    CdkDropList,
    LetDirective,
    CdkDrag,
    NzTooltipDirective,
    AsyncPipe,
    AtsPricePipe
  ]
})
export class ScalperOrderBookTableComponent implements OnInit {
  private readonly cancelOrdersCommand = inject(CancelOrdersCommand);
  private readonly themeService = inject(ThemeService);
  private readonly commandProcessorService = inject(ScalperCommandProcessorService);
  private readonly hotkeysService = inject(ScalperHotKeyCommandService);
  private readonly rulerContext = inject<RulerContext>(RULER_CONTEX, { skipSelf: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly numberFormats = NumberDisplayFormat;
  readonly rowTypes = ScalperOrderBookRowType;
  readonly orderTypes = OrderType;

  ordersSides = Side;
  readonly rowHeight = input.required<number>();

  displayItems$!: Observable<DisplayRow[]>;

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  readonly hideTooltips = input(false);

  readonly isActive = input(false);

  showGrowingVolume = false;

  readonly hoveredRow$ = this.rulerContext.hoveredRow$;

  getPriceCellClasses(row: BodyRow): any {
    return {
      ...this.getVolumeCellClasses(row),
      'current-position-range-item': !!(row.currentPositionRangeSign ?? 0),
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
      'mixed-item': row.rowType === ScalperOrderBookRowType.Mixed,
      'best-row': row.isBest
    };
  }

  ngOnInit(): void {
    this.initDisplayItems();
    this.subscribeToHotkeys();
  }

  getFilteredOrders(orders: CurrentOrderDisplay[], type: OrderType): {
    orders: CurrentOrderDisplay[];
    volume: number;
  } {
    const limitOrders = orders.filter(x => x.type === type);

    return {
      orders: limitOrders,
      volume: limitOrders.reduce((previousValue, currentValue) => previousValue + currentValue.displayVolume, 0)
    };
  }

  cancelOrders(e: MouseEvent, orders: CurrentOrderDisplay[]): void {
    e.preventDefault();
    e.stopPropagation();

    const filteredOrders = orders.filter(o => !o.isDirty);

    if (filteredOrders.length > 0) {
      this.cancelOrdersCommand.execute({
        ordersToCancel: filteredOrders.map(x => ({
          orderId: x.orderId,
          exchange: x.targetInstrument.exchange,
          portfolio: x.ownedPortfolio.portfolio,
          orderType: x.type
        }))
      });
    }
  }

  mouseDown(e: MouseEvent, row: DisplayRow): void {
    if (e.button === 0) {
      this.commandProcessorService.processLeftMouseClick(e, row, this.dataContext());
    } else if (e.button === 2) {
      this.commandProcessorService.processRightMouseClick(e, row, this.dataContext());
    }

    e.preventDefault();
    e.stopPropagation();
    document.getSelection()?.removeAllRanges();
  }

  updateOrderPrice(orders: CurrentOrderDisplay[], row: DisplayRow): void {
    this.commandProcessorService.updateOrdersPrice(orders, row, this.dataContext());
  }

  updateHoveredItem(hoveredItem: { price: number } | null): void {
    this.rulerContext.setHoveredRow(hoveredItem);
  }

  isAllOrdersHaveSide(orders: CurrentOrderDisplay[], side: Side): boolean {
    return orders.length > 0 && orders.every(o => o.side === side);
  }

  hasDirtyOrders(orders: CurrentOrderDisplay[]): boolean {
    return orders.some(o => o.isDirty);
  }

  getPriceDecimalSymbolsCount(settings: ScalperOrderBookExtendedSettings): number | null {
    return settings.widgetSettings.showPriceWithZeroPadding === true
      ? MathHelper.getPrecision(settings.instrument.minstep)
      : null;
  }

  private initDisplayItems(): void {
    this.displayItems$ = combineLatest([
      this.dataContext().extendedSettings$,
      this.dataContext().orderBookBody$,
      this.dataContext().displayRange$,
      this.dataContext().currentOrders$,
      this.themeService.getThemeSettings()
    ]).pipe(
      map(([settings, body, displayRange, currentOrders, themeSettings]) => {
        const displayRows = body.slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));
        const minOrderPrice = Math.min(...currentOrders.map(x => {
          if (x.triggerPrice != null) {
            return x.triggerPrice;
          }

          if (x.price != null) {
            return x.price;
          }

          throw new Error('Price or trigger price should be present');
        }));
        const maxOrderPrice = Math.max(...currentOrders.map(x => {
          if (x.triggerPrice != null) {
            return x.triggerPrice;
          }

          if (x.price != null) {
            return x.price;
          }

          throw new Error('Price or trigger price should be present');
        }));
        const volumeHighlightStrategy = this.getVolumeHighlightStrategy(settings.widgetSettings, themeSettings);
        const maxOrderBookVolume = settings.widgetSettings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume
          ? body.reduce((max, curr) => Math.max(max, curr.askVolume ?? 0, curr.bidVolume ?? 0), 0)
          : 0;

        return displayRows.map(row => {
          const displayRow = {
            ...row,
            currentOrders: [],
            getVolumeStyle: () => volumeHighlightStrategy({
              rowType: row.rowType!,
              askVolume: row.askVolume ?? 0,
              bidVolume: row.bidVolume ?? 0,
              maxVolume: maxOrderBookVolume
            }) as VolumeHighlightStrategy

          } as DisplayRow;

          if (row.baseRange.max >= minOrderPrice && row.baseRange.min <= maxOrderPrice) {
            displayRow.currentOrders = currentOrders.filter(x => {
              if (x.triggerPrice != null) {
                return x.triggerPrice >= row.baseRange.min && x.triggerPrice <= row.baseRange.max;
              }

              if (x.price != null) {
                return x.price >= row.baseRange.min && x.price <= row.baseRange.max;
              }

              throw new Error('Price or trigger price should be present');
            });
          }

          return displayRow;
        });
      })
    );
  }

  private subscribeToHotkeys(): void {
    this.dataContext().extendedSettings$.pipe(
      mapWith(
        () => this.hotkeysService.commands$,
        (settings, command) => ({settings, command})
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({settings, command}) => {
      if (command.type === ActiveOrderBookHotKeysTypes.toggleGrowingVolumeDisplay) {
        if (this.isActive()) {
          setTimeout(() => this.showGrowingVolume = !this.showGrowingVolume);
        }

        return;
      }

      if (settings.widgetSettings.disableHotkeys) {
        return;
      }

      this.commandProcessorService.processHotkeyPress(command, this.isActive(), this.dataContext());
    });
  }

  private getVolumeHighlightStrategy(settings: ScalperOrderBookWidgetSettings, themeSettings: ThemeSettings): VolumeHighlightStrategy {
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
      if (args.rowType !== ScalperOrderBookRowType.Ask && args.rowType !== ScalperOrderBookRowType.Bid && args.rowType !== ScalperOrderBookRowType.Mixed) {
        return {
          width: 0
        };
      }

      const size = 100 * (Math.max(args.askVolume, args.bidVolume) / args.maxVolume);
      let backgroundColor = color(themeSettings.themeColors.mixColor);

      if (args.rowType === ScalperOrderBookRowType.Bid) {
        backgroundColor = color(themeSettings.themeColors.buyColor);
      } else if (args.rowType === ScalperOrderBookRowType.Ask) {
        backgroundColor = color(themeSettings.themeColors.sellColor);
      }

      backgroundColor!.opacity = 0.6;
      return {
        'background-color': backgroundColor?.formatRgb(),
        'width': `${Math.ceil(size)}%`,
      };
    };
  }

  private volumeBoundsWithFixedValueStrategy(settings: ScalperOrderBookWidgetSettings): VolumeHighlightStrategy {
    return (args: VolumeHighlightArguments) => {
      if (args.rowType !== ScalperOrderBookRowType.Ask && args.rowType !== ScalperOrderBookRowType.Bid && args.rowType !== ScalperOrderBookRowType.Mixed) {
        return null;
      }

      let size = 0;
      const volume = Math.max(args.askVolume, args.bidVolume);
      const volumeHighlightOption = this.getVolumeHighlightOption(settings, volume);
      if (!volumeHighlightOption) {
        return null;
      }

      if (settings.volumeHighlightFullness != null && settings.volumeHighlightFullness) {
        size = 100 * (volume / settings.volumeHighlightFullness!);
        if (size > 100) {
          size = 100;
        }
      }

      return {
        'background-color': volumeHighlightOption.color,
        'width': `${Math.ceil(size)}%`,
      };
    };
  }

  private getVolumeHighlightOption(settings: ScalperOrderBookWidgetSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => b.boundary - a.boundary)
      .find(x => volume >= x.boundary);
  }
}
