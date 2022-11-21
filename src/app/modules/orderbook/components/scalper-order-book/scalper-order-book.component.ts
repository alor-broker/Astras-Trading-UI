import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  interval,
  NEVER,
  Observable,
  of,
  share,
  shareReplay,
  Subject,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs";
import {
  CurrentOrder,
  ScalperOrderBookPositionState,
  ScalperOrderBookRow,
  ScalperOrderBookRowType
} from "../../models/scalper-order-book.model";
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from "../../../../shared/models/settings/scalper-order-book-settings.model";
import {
  finalize,
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { HotKeyCommandService } from "../../../../shared/services/hot-key-command.service";
import { Side } from "../../../../shared/models/enums/side.model";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { isEqualScalperOrderBookSettings } from "../../../../shared/utils/settings-helper";
import { ScalperOrdersService } from "../../services/scalper-orders.service";
import { ScalperOrderBookCommands } from "../../models/scalper-order-book-commands";
import { TerminalCommand } from "../../../../shared/models/terminal-command";
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";
import { DashboardItemContentSize } from '../../../../shared/models/dashboard-item.model';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { OrderbookData } from '../../models/orderbook-data.model';
import { OrderbookDataRow } from '../../models/orderbook-data-row.model';
import { ScalperOrderBookComponentStore } from '../../utils/scalper-order-book-component-store';
import { OrderBookDataFeedHelper } from '../../utils/order-book-data-feed.helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { ScalperOrderBookTableHelper } from '../../utils/scalper-order-book-table.helper';
import { Position } from '../../../../shared/models/positions/position.model';
import { ThemeSettings } from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import { MathHelper } from "../../../../shared/utils/math-helper";

type ExtendedSettings = { widgetSettings: ScalperOrderBookSettings, instrument: Instrument };


@Component({
  selector: 'ats-scalper-order-book[guid][shouldShowSettings][contentSize]',
  templateUrl: './scalper-order-book.component.html',
  styleUrls: ['./scalper-order-book.component.less'],
  providers: [ScalperOrderBookComponentStore]
})
export class ScalperOrderBookComponent implements OnInit, AfterViewInit, OnDestroy {
  rowTypes = ScalperOrderBookRowType;
  readonly tableRowHeight = 21;
  readonly priceRowsCacheSize = 50;

  @ViewChild('orderBookTableContainer')
  orderBookTableContainer?: ElementRef<HTMLElement>;
  @ViewChild('table')
  table?: NzTableComponent<any>;

  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;

  @Input()
  isActive: boolean = false;

  orderBookTableContainerHeight$?: Observable<number>;
  readonly isLoading$ = new BehaviorSubject(true);
  orderBookTableData$!: Observable<ScalperOrderBookRow[]>;
  readonly contentSize$ = new BehaviorSubject<DashboardItemContentSize>({ height: 100, width: 0 });
  maxVolume: number = 1;
  workingVolumes: number[] = [];
  activeWorkingVolume$ = new BehaviorSubject<number | null>(null);
  isAutoAlignAvailable$!: Observable<boolean>;
  readonly enableAutoAlign$ = new BehaviorSubject(true);
  orderBookPosition$!: Observable<ScalperOrderBookPositionState | null>;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  private orderBookContext?: {
    extendedSettings$: Observable<ExtendedSettings>;
    currentOrders$: Observable<CurrentOrder[]>;
    orderBookData$: Observable<OrderbookData>;
    orderBookPosition$: Observable<Position | null>;
    themeSettings$: Observable<ThemeSettings>;
  };

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly scalperOrderBookStore: ScalperOrderBookComponentStore,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly orderBookService: ScalperOrderBookService,
    private readonly instrumentsService: InstrumentsService,
    private readonly hotkeysService: HotKeyCommandService,
    private readonly scalperOrdersService: ScalperOrdersService,
    private readonly themeService: ThemeService
  ) {
  }

  @Input()
  set contentSize(value: DashboardItemContentSize | null) {
    if (!!value) {
      this.contentSize$.next(value);
    }
  }

  ngOnInit(): void {
    this.initOrderBookContext();
    this.orderBookTableData$ = this.getOrderBookTableData().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.orderBookPosition$ = this.getPositionStateStream();

    this.subscribeToHotkeys();
    this.subscribeToWorkingVolumesChange();
    this.initAutoAlign();
  }

  ngAfterViewInit(): void {
    this.orderBookTableContainerHeight$ = (this.getOrderBookTableContainerHeightWatch() ?? of(0)).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.initPriceRowsGeneration();
    this.initTableScrolling();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.activeWorkingVolume$.complete();
    this.contentSize$.complete();
    this.enableAutoAlign$.complete();
  }

  selectVol(vol: number) {
    this.activeWorkingVolume$.next(vol);
  }

  getCurrentOrdersVolume(orders?: CurrentOrder[]): number | null {
    return !orders || orders.length === 0
      ? null
      : orders.reduce((previousValue, currentValue) => previousValue + currentValue.volume, 0);
  }

  getVolumeStyle(rowType: ScalperOrderBookRowType, volume: number, settings: ScalperOrderBookSettings, theme: ThemeSettings) {
    if (rowType !== ScalperOrderBookRowType.Ask && rowType !== ScalperOrderBookRowType.Bid || !volume) {
      return null;
    }

    if (settings.volumeHighlightMode === VolumeHighlightMode.Off) {
      return null;
    }

    if (settings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume) {
      const size = 100 * (volume / this.maxVolume);
      const color = rowType === ScalperOrderBookRowType.Bid
        ? theme.themeColors.buyColorBackground
        : theme.themeColors.sellColorBackground;

      return {
        background: `linear-gradient(90deg, ${color} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    }

    let size = 0;
    const volumeHighlightOption = this.getVolumeHighlightOption(settings, volume);
    if (!volumeHighlightOption) {
      return null;
    }

    if (!!settings.volumeHighlightFullness) {
      size = 100 * (volume / settings.volumeHighlightFullness);
      if (size > 100) {
        size = 100;
      }
    }

    return {
      background: `linear-gradient(90deg, ${volumeHighlightOption.color}BF ${size}% , rgba(0,0,0,0) ${size}%)`
    };
  }

  cancelRowOrders(row: ScalperOrderBookRow, e: MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();

    if (!!row.currentOrders && row.currentOrders.length > 0) {
      this.scalperOrdersService.cancelOrders(row.currentOrders);
    }
  }

  onRowClick(e: MouseEvent, row: ScalperOrderBookRow) {
    e.preventDefault();
    e.stopPropagation();
    document.getSelection()?.removeAllRanges();

    if (row.rowType !== this.rowTypes.Bid && row.rowType !== this.rowTypes.Ask) {
      return;
    }

    if (e.ctrlKey) {
      this.callWithSettings(settings => {
        this.callWithWorkingVolume(workingVolume => {
          this.scalperOrdersService.setStopLimitForRow(settings.widgetSettings, row, workingVolume, settings.widgetSettings.enableMouseClickSilentOrders);
        });
      });

      return;
    }

    if (e.shiftKey) {
      this.callWithSettings(settings => this.scalperOrdersService.setStopLoss(settings.widgetSettings, row.price, settings.widgetSettings.enableMouseClickSilentOrders));
      return;
    }

    if (!e.shiftKey && !e.ctrlKey) {
      this.callWithSettings(settings => {
        this.callWithWorkingVolume(workingVolume => {
          this.scalperOrdersService.placeLimitOrder(
            settings.widgetSettings,
            row.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell,
            workingVolume,
            row.price,
            settings.widgetSettings.enableMouseClickSilentOrders
          );
        });
      });
    }
  }

  onRowRightClick(event: MouseEvent, row: ScalperOrderBookRow) {
    event.preventDefault();
    event.stopPropagation();
    document.getSelection()?.removeAllRanges();

    if (row.rowType !== this.rowTypes.Bid && row.rowType !== this.rowTypes.Ask) {
      return;
    }

    this.callWithSettings(settings => {
      this.callWithWorkingVolume(workingVolume => {
        this.scalperOrdersService.placeMarketOrder(
          settings.widgetSettings,
          row.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy,
          workingVolume,
          settings.widgetSettings.enableMouseClickSilentOrders
        );
      });
    });
  }

  switchEnableAutoAlign() {
    this.enableAutoAlign$.pipe(
      take(1)
    ).subscribe(value => {
      const newValue = !value;
      this.enableAutoAlign$.next(!value);
      if (newValue) {
        this.alignTable();
      }
    });
  }

  private cancelLimitOrders() {
    this.callWithCurrentOrders(orders => {
      const limitOrders = orders.filter(x => x.type === 'limit');

      this.scalperOrdersService.cancelOrders(limitOrders);
    });
  }

  private initPriceRowsGeneration() {
    const getLastPrice = (instrumentKey: InstrumentKey) => this.orderBookService.getLastPrice(instrumentKey).pipe(
      filter((lastPrice): lastPrice is number => !!lastPrice),
    );

    this.orderBookContext?.extendedSettings$.pipe(
      tap(() => this.isLoading$.next(true)),
      tap(() => this.scalperOrderBookStore.resetState()),
      mapWith(
        settings => getLastPrice(settings.widgetSettings),
        (settings, lastPrice) => ({
          settings,
          lastPrice
        })
      ),
      mapWith(
        () => this.orderBookTableContainerHeight$ ?? of(0),
        (source, height) => ({
          instrument: source.settings.instrument,
          lastPrice: source.lastPrice,
          containerHeight: height
        })
      ),
      takeUntil(this.destroy$)
    ).subscribe(source => {
      let rowCountToDisplay = Math.ceil(source.containerHeight / this.tableRowHeight) + this.priceRowsCacheSize;
      this.scalperOrderBookStore.setInitialRange(
        source.lastPrice,
        source.instrument.minstep,
        rowCountToDisplay,
        () => {
          this.alignTable();
          this.isLoading$.next(false);
        }
      );
    });
  }

  private getOrderBookTableData(): Observable<ScalperOrderBookRow[]> {
    return combineLatest([
      this.orderBookContext!.extendedSettings$,
      this.orderBookContext!.themeSettings$,
      this.scalperOrderBookStore.rows$,
      this.orderBookContext!.orderBookData$,
      this.orderBookContext!.currentOrders$,
      this.orderBookContext!.orderBookPosition$,
    ]).pipe(
      tap(([, , , orderBookData, ,]) => {
        const allRows = [...orderBookData.a, ...orderBookData.b];
        if (allRows.length > 0) {
          this.maxVolume = Math.max(...allRows.map(x => x.v));
        }
      }),
      map(([settings, theme, baseRows, orderBookData, currentOrders, currentPosition]) =>
        this.mapOrderBookData(settings, baseRows, orderBookData, currentOrders, currentPosition, theme))
    );
  }

  private mapOrderBookData(
    settings: ExtendedSettings,
    baseRows: ScalperOrderBookRow[],
    orderBookData: OrderbookData,
    currentOrders: CurrentOrder[],
    currentPosition: Position | null,
    theme: ThemeSettings
  ): ScalperOrderBookRow[] {
    if (baseRows.length === 0 || orderBookData.a.length === 0 || orderBookData.b.length === 0) {
      return baseRows;
    }

    const orderBookBounds = {
      minAsk: orderBookData.a[0].p,
      maxAsk: orderBookData.a[orderBookData.a.length - 1].p,
      minBid: orderBookData.b[orderBookData.b.length - 1].p,
      maxBid: orderBookData.b[0].p
    };

    const maxBasePrice = baseRows[0].price;
    const minBasePrice = baseRows[baseRows.length - 1].price;

    if (orderBookBounds.minBid < minBasePrice || orderBookBounds.maxAsk > maxBasePrice) {
      this.scalperOrderBookStore.regenerateForPrice(
        orderBookBounds.minBid,
        orderBookBounds.maxAsk,
        settings.instrument.minstep,
        () => this.alignTable()
      );

      return baseRows;
    }

    const filteredOrders = currentOrders.filter(x => x.type === 'limit');
    const minOrderPrice = Math.min(...filteredOrders.map(x => x.price));
    const maxOrderPrice = Math.max(...filteredOrders.map(x => x.price));

    const rows: ScalperOrderBookRow[] = [];
    for (let i = 0; i < baseRows.length; i++) {
      const row = { ...baseRows[i] };

      if (!this.mapOrderBook(row, orderBookData, settings.widgetSettings, theme, orderBookBounds)) {
        continue;
      }

      if (row.price >= minOrderPrice && row.price <= maxOrderPrice) {
        row.currentOrders = filteredOrders.filter(x => x.price === row.price);
      }

      if (!!currentPosition && currentPosition.qtyTFuture !== 0) {
        const basePrice = currentPosition.qtyTFuture > 0
          ? orderBookBounds.maxBid
          : orderBookBounds.minAsk;

        const sign = currentPosition.qtyTFuture > 0 ? 1 : -1;
        const currentPositionRangeSign = (basePrice - currentPosition.avgPrice) * sign;

        const isCurrentPositionRange = row.price <= basePrice && row.price >= currentPosition.avgPrice
          || (row.price >= basePrice && row.price <= currentPosition.avgPrice);

        row.currentPositionRangeSign = isCurrentPositionRange
          ? currentPositionRangeSign
          : null;
      }

      rows.push(row);
    }

    return rows;
  }

  private initOrderBookContext() {
    const settings$ = this.getSettingsStream()
      .pipe(
        shareReplay(1)
      );

    this.orderBookContext = {
      extendedSettings$: settings$,
      currentOrders$: this.getCurrentOrdersStream(settings$),
      orderBookData$: this.getOrderBookDataStream(settings$),
      orderBookPosition$: this.getOrderBookPositionStream(settings$),
      themeSettings$: this.themeService.getThemeSettings()
    };
  }

  private getSettingsStream(): Observable<ExtendedSettings> {
    const getInstrumentInfo = (settings: ScalperOrderBookSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    return this.settingsService.getSettings<ScalperOrderBookSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualScalperOrderBookSettings(previous, current)),
      mapWith(
        settings => getInstrumentInfo(settings),
        (widgetSettings, instrument) => ({ widgetSettings, instrument } as ExtendedSettings)
      )
    );
  }

  private getCurrentOrdersStream(settings$: Observable<ExtendedSettings>): Observable<CurrentOrder[]> {
    return settings$.pipe(
      switchMap(
        (settings: ExtendedSettings) => this.orderBookService.getCurrentOrders(settings.widgetSettings)
      ),
      map(orders => orders.map(o => OrderBookDataFeedHelper.orderToCurrentOrder(o))),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getOrderBookDataStream(settings$: Observable<ExtendedSettings>): Observable<OrderbookData> {
    return settings$.pipe(
      switchMap((settings: ExtendedSettings) => this.orderBookService.getOrderBook(settings.widgetSettings)),
      startWith(({ a: [], b: [] } as OrderbookData)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getOrderBookPositionStream(settings$: Observable<ExtendedSettings>): Observable<Position | null> {
    return settings$.pipe(
      switchMap((settings: ExtendedSettings) => this.orderBookService.getOrderBookPosition(settings.widgetSettings)),
      share()
    );
  }

  private initTableScrolling() {
    this.table?.cdkVirtualScrollViewport?.scrolledIndexChange
      .pipe(
        withLatestFrom(this.isLoading$),
        filter(([, isLoading]) => !isLoading),
        map(([index,]) => index),
        withLatestFrom(this.scalperOrderBookStore.rows$),
        filter(([, priceRows]) => priceRows.length > 0),
        map(([index, priceRows]) => ({ index, priceRows })),
        takeUntil(this.destroy$)
      )
      .subscribe(x => {
        const bufferSize = Math.ceil(this.priceRowsCacheSize / 4);
        if (x.index < bufferSize) {
          this.isLoading$.next(true);
          this.scalperOrderBookStore.extendTop(addedItemsCount => {
            ScalperOrderBookTableHelper.scrollTableToIndex(
              this.table?.cdkVirtualScrollViewport,
              this.tableRowHeight,
              x.index + addedItemsCount,
              false,
              false
            );

            this.isLoading$.next(false);
          });

          return;
        }

        const renderedRange = this.table!.cdkVirtualScrollViewport!.getRenderedRange();
        if (renderedRange.end > x.priceRows.length - bufferSize) {
          this.isLoading$.next(true);
          this.scalperOrderBookStore.extendBottom(() => {
            this.isLoading$.next(false);
          });
        }
      });
  }

  private mapOrderBook(
    row: ScalperOrderBookRow,
    orderBookData: OrderbookData,
    settings: ScalperOrderBookSettings,
    theme: ThemeSettings,
    orderBookBounds: {
      minAsk: number,
      maxAsk: number,
      minBid: number,
      maxBid: number
    }
  ): boolean {
    const matchRow = (targetRow: ScalperOrderBookRow, source: OrderbookDataRow[], rowType: ScalperOrderBookRowType) => {
      const matchedRowIndex = source.findIndex(x => x.p === targetRow.price);
      if (matchedRowIndex >= 0) {
        const matchedRow = source[matchedRowIndex];
        targetRow.volume = matchedRow.v;
        targetRow.isBest = matchedRowIndex === 0;
        targetRow.getVolumeStyle = () => this.getVolumeStyle(rowType, targetRow.volume ?? 0, settings, theme);

        return true;
      }

      return false;
    };

    if (row.price >= orderBookBounds.minAsk) {
      row.rowType = ScalperOrderBookRowType.Ask;
      if (row.price <= orderBookBounds.maxAsk) {
        if (!matchRow(row, orderBookData.a, row.rowType)) {
          if (settings.showZeroVolumeItems) {
            row.isFiller = true;
          }
          else {
            return false;
          }
        }
      }
      return true;
    }
    else if (row.price <= orderBookBounds.maxBid) {
      row.rowType = ScalperOrderBookRowType.Bid;
      if (row.price >= orderBookBounds.minBid) {
        if (!matchRow(row, orderBookData.b, row.rowType)) {
          if (settings.showZeroVolumeItems) {
            row.isFiller = true;
          }
          else {
            return false;
          }
        }
      }
      return true;
    }
    else if (settings.showSpreadItems) {
      row.rowType = ScalperOrderBookRowType.Spread;
      return true;
    }

    return false;
  }

  private getOrderBookTableContainerHeightWatch(): Observable<number> | null {
    if (!this.orderBookTableContainer) {
      return null;
    }

    const subject = new Subject<number>();
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(x => {
        subject.next(Math.floor(x.contentRect.height));
      });
    });

    resizeObserver.observe(this.orderBookTableContainer.nativeElement);

    return subject.pipe(
      finalize(() => {
        if (!!this.orderBookTableContainer) {
          resizeObserver.unobserve(this.orderBookTableContainer.nativeElement);
        }

        resizeObserver.disconnect();
      })
    );
  }

  private callWithSettings(action: (settings: { widgetSettings: ScalperOrderBookSettings, instrument: Instrument }) => void) {
    this.orderBookContext!.extendedSettings$.pipe(
      take(1)
    ).subscribe(s => action(s));
  }

  private callWithWorkingVolume(action: (workingVolume: number) => void) {
    this.activeWorkingVolume$.pipe(
      take(1),
      filter(workingVolume => !!workingVolume)
    ).subscribe(workingVolume => action(workingVolume!));
  }

  private callWithCurrentOrderBook(action: (orderBook: OrderbookData) => void) {
    this.orderBookContext!.orderBookData$.pipe(
      take(1)
    ).subscribe(action);
  }

  private callWithCurrentOrders(action: (orders: CurrentOrder[]) => void) {
    this.orderBookContext!.currentOrders$.pipe(
      take(1)
    ).subscribe(action);
  }

  private subscribeToHotkeys() {
    this.orderBookContext?.extendedSettings$?.pipe(
      mapWith(
        () => this.hotkeysService.commands$,
        (settings, command) => ({ settings, command })
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ settings, command }) => {
      if (this.handleCommonCommands(command)) {
        return;
      }

      if (settings.widgetSettings.disableHotkeys) {
        return;
      }

      if (this.handleAllCommands(command)) {
        return;
      }

      if (!this.isActive) {
        return;
      }

      this.handleCurrentOrderBookCommands(command);
    });
  }

  private handleCommonCommands(command: TerminalCommand): boolean {
    if (command.type === ScalperOrderBookCommands.centerOrderBook) {
      this.alignTable();

      return true;
    }

    return false;
  }

  private handleAllCommands(command: TerminalCommand): boolean {
    if (command.type === ScalperOrderBookCommands.cancelLimitOrdersAll) {
      this.cancelLimitOrders();
      return true;
    }

    if (command.type === ScalperOrderBookCommands.closePositionsByMarketAll) {
      this.closePositionsByMarket();
      return true;
    }

    return false;
  }

  private handleCurrentOrderBookCommands(command: TerminalCommand) {
    if (command.type === ScalperOrderBookCommands.cancelLimitOrdersCurrent) {
      this.cancelLimitOrders();
      return;
    }

    if (command.type === ScalperOrderBookCommands.closePositionsByMarketCurrent) {
      this.closePositionsByMarket();
      return;
    }

    if (command.type === ScalperOrderBookCommands.sellBestOrder) {
      this.placeBestOrder(Side.Sell);
      return;
    }

    if (command.type === ScalperOrderBookCommands.buyBestOrder) {
      this.placeBestOrder(Side.Buy);
      return;
    }

    if (command.type === ScalperOrderBookCommands.sellBestBid) {
      this.callWithSettings(settings => {
        this.callWithCurrentOrderBook(orderBook => {
          this.callWithWorkingVolume(workingVolume => {
            this.scalperOrdersService.sellBestBid(settings.instrument, workingVolume!, orderBook);
          });
        });
      });

      return;
    }

    if (command.type === ScalperOrderBookCommands.buyBestAsk) {
      this.callWithSettings(settings => {
        this.callWithCurrentOrderBook(orderBook => {
          this.callWithWorkingVolume(workingVolume => {
            this.scalperOrdersService.buyBestAsk(settings.instrument, workingVolume!, orderBook);
          });
        });
      });

      return;
    }

    if (command.type === ScalperOrderBookCommands.sellMarket) {
      this.placeMarketOrderSilent(Side.Sell);
      return;
    }

    if (command.type === ScalperOrderBookCommands.buyMarket) {
      this.placeMarketOrderSilent(Side.Buy);
      return;
    }

    if (command.type === ScalperOrderBookCommands.reversePositionsByMarketCurrent) {
      this.callWithSettings(settings => this.scalperOrdersService.reversePositionsByMarket(settings.widgetSettings));
      return;
    }

    if (/^\d$/.test(command.type)) {
      const index = Number(command.type);
      if (index && index <= this.workingVolumes.length && index > 0) {
        this.selectVol(this.workingVolumes[index - 1]);
      }
    }
  }

  private placeMarketOrderSilent(side: Side) {
    this.callWithSettings(settings => {
      this.callWithWorkingVolume(workingVolume => {
        this.scalperOrdersService.placeMarketOrder(settings.widgetSettings, side, workingVolume, true);
      });
    });
  }

  private closePositionsByMarket() {
    this.callWithSettings(settings => this.scalperOrdersService.closePositionsByMarket(settings.widgetSettings));
  }

  private subscribeToWorkingVolumesChange() {
    this.terminalSettingsService.getSettings().pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) =>
        prev.hotKeysSettings?.workingVolumes?.length === curr.hotKeysSettings?.workingVolumes?.length),
      withLatestFrom(this.orderBookContext!.extendedSettings$.pipe(take(1))),
    ).subscribe(([terminalSettings, settings]) => {
      this.settingsService.updateSettings(this.guid, {
        workingVolumes: terminalSettings.hotKeysSettings?.workingVolumes
          ?.map((wv, i) => settings.widgetSettings.workingVolumes[i] || 10 ** i)
      });
    });

    this.orderBookContext!.extendedSettings$!.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.workingVolumes = settings.widgetSettings.workingVolumes;

      if (!this.activeWorkingVolume$.getValue()) {
        this.activeWorkingVolume$.next(this.workingVolumes[0]);
      }
    });
  }

  private placeBestOrder(side: Side) {
    this.callWithSettings(settings => {
      this.callWithCurrentOrderBook(orderBook => {
        this.callWithWorkingVolume(workingVolume => {
          this.scalperOrdersService.placeBestOrder(settings.instrument, side, workingVolume!, orderBook);
        });
      });
    });
  }

  private getVolumeHighlightOption(settings: ScalperOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => b.boundary - a.boundary)
      .find(x => volume >= x.boundary);
  }

  private alignTable() {
    ScalperOrderBookTableHelper.alignTable(
      this.table?.cdkVirtualScrollViewport,
      this.tableRowHeight,
      this.orderBookTableData$
    );
  }

  private initAutoAlign() {
    this.isAutoAlignAvailable$ = this.orderBookContext!.extendedSettings$.pipe(
      map(s => !!s.widgetSettings.autoAlignIntervalSec && s.widgetSettings.autoAlignIntervalSec > 0),
      shareReplay(1)
    );

    this.orderBookContext?.extendedSettings$.pipe(
      map(settings => settings.widgetSettings.autoAlignIntervalSec),
      filter((x): x is number => !!x && x > 0),
      mapWith(() => this.enableAutoAlign$, (interval, enabled) => ({ interval, enabled })),
      switchMap(s => s.enabled ? interval(s.interval * 1000) : NEVER),
      takeUntil(this.destroy$)
    ).subscribe(() => this.alignTable());
  }

  private getPositionStateStream(): Observable<ScalperOrderBookPositionState | null> {
    return combineLatest([
      this.orderBookContext!.extendedSettings$,
      this.orderBookContext!.orderBookData$,
      this.orderBookContext!.orderBookPosition$
    ]).pipe(
      map(([settings, orderBook, position]) => {
        if (!position || position.qtyTFuture === 0 || orderBook.a.length === 0 || orderBook.b.length === 0) {
          return null;
        }

        const sign = position!.qtyTFuture > 0 ? 1 : -1;
        const bestPrice = sign > 0
          ? orderBook.b[0].p
          : orderBook.a[0].p;

        const rowsDifference = Math.round((bestPrice - position!.avgPrice) / settings.instrument.minstep) * sign;

        const minStepDigitsAfterPoint = MathHelper.getPrecision(settings.instrument.minstep);

        return {
          qty: position!.qtyTFutureBatch,
          price: MathHelper.round(position!.avgPrice, minStepDigitsAfterPoint),
          lossOrProfit: rowsDifference
        };
      })
    );
  }
}
