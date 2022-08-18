import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  BehaviorSubject,
  delay,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs";
import {
  CurrentOrder,
  OrderBookItem,
  ScalperOrderBook,
  ScalperOrderBookRowType,
  ScalperOrderBookRowView,
  ScalperOrderBookView
} from "../../models/scalper-order-book.model";
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from "../../../../shared/models/settings/scalper-order-book-settings.model";
import {
  map,
  startWith
} from "rxjs/operators";
import {
  buyColorBackground,
  sellColorBackground
} from "../../../../shared/models/settings/styles-constants";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { getTypeByCfi } from "../../../../shared/utils/instruments";
import { InstrumentType } from "../../../../shared/models/enums/instrument-type.model";
import { HotKeyCommandService } from "../../../../shared/services/hot-key-command.service";
import { Side } from "../../../../shared/models/enums/side.model";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { isEqualScalperOrderBookSettings } from "../../../../shared/utils/settings-helper";
import { ScalperOrdersService } from "../../services/scalper-orders.service";
import { ScalperOrderBookCommands } from "../../models/scalper-order-book-commands";
import { TerminalCommand } from "../../../../shared/models/terminal-command";
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";

@Component({
  selector: 'ats-scalper-order-book[guid][shouldShowSettings]',
  templateUrl: './scalper-order-book.component.html',
  styleUrls: ['./scalper-order-book.component.less']
})
export class ScalperOrderBookComponent implements OnInit, OnDestroy {
  rowTypes = ScalperOrderBookRowType;
  maxVolume: number = 1;
  workingVolumes: number[] = [];
  activeWorkingVolume$ = new BehaviorSubject<number | null>(null);

  isActiveOrderBook = false;

  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;

  orderBook$!: Observable<ScalperOrderBookView>;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$: Observable<ScalperOrderBookSettings> | null = null;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly orderBookService: ScalperOrderBookService,
    private readonly instrumentsService: InstrumentsService,
    private readonly hotkeysService: HotKeyCommandService,
    private readonly scalperOrdersService: ScalperOrdersService,
    private readonly elementRef: ElementRef<HTMLElement>
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<ScalperOrderBookSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualScalperOrderBookSettings(previous, current)),
      shareReplay(1)
    );

    const getInstrumentInfo = (settings: ScalperOrderBookSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    this.orderBook$ = this.settings$.pipe(
      mapWith(
        settings => getInstrumentInfo(settings),
        (settings, instrument) => ({ settings, instrument })
      ),
      mapWith(
        ({ settings, instrument }) => this.orderBookService.getOrderBookRealtimeData(settings, instrument),
        ({ settings, instrument }, orderBook) => ({ settings, instrument, orderBook })
      ),
      map(x => this.toViewModel(x.settings, x.instrument, x.orderBook)),
      tap(orderBook => {
        this.maxVolume = Math.max(...orderBook.rows.map(x => x.volume ?? 0));
      }),
      startWith(({ rows: [], allActiveOrders: [] } as ScalperOrderBookView)),
      shareReplay(1)
    );

    this.subscribeToHotkeys();
    this.subscribeToWorkingVolumesChange();

    this.orderBook$.pipe(
      take(1),
      delay(1000)
    ).subscribe(() => this.alignBySpread());
  }

  selectVol(vol: number) {
    this.activeWorkingVolume$.next(vol);
  }

  getTrackKey(index: number): number {
    return index;
  }

  getCurrentOrdersVolume(orders: CurrentOrder[]): number | null {
    return orders.length === 0
      ? null
      : orders.reduce((previousValue, currentValue) => previousValue + currentValue.volume, 0);
  }

  getVolumeStyle(rowType: ScalperOrderBookRowType, volume: number, settings: ScalperOrderBookSettings) {
    if (rowType !== ScalperOrderBookRowType.Ask && rowType !== ScalperOrderBookRowType.Bid || !volume) {
      return null;
    }

    if (settings.volumeHighlightMode === VolumeHighlightMode.Off) {
      return null;
    }

    if (settings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume) {
      const size = 100 * (volume / this.maxVolume);
      const color = rowType === ScalperOrderBookRowType.Bid
        ? buyColorBackground
        : sellColorBackground;

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

  cancelLimitOrders() {
    this.callWithCurrentOrderBook(orderBook => {
      const orders = orderBook.allActiveOrders
      .filter(x => x.type === 'limit');

      this.scalperOrdersService.cancelOrders(orders);
    });
  }

  cancelRowOrders(row: ScalperOrderBookRowView, e: MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();

    this.scalperOrdersService.cancelOrders(row.currentOrders);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.activeWorkingVolume$.complete();
  }

  onRowClick(e: MouseEvent, row: ScalperOrderBookRowView) {
    e.preventDefault();
    e.stopPropagation();

    if (row.rowType !== this.rowTypes.Bid && row.rowType !== this.rowTypes.Ask) {
      return;
    }

    if (e.ctrlKey) {
      this.callWithSettings(settings => {
        this.callWithWorkingVolume(workingVolume => {
          this.scalperOrdersService.setStopLimitForRow(settings, row, workingVolume, settings.enableMouseClickSilentOrders);
        });
      });

      return;
    }

    if (e.shiftKey && row.rowType === this.rowTypes.Ask) {
      this.callWithSettings(settings => this.scalperOrdersService.setStopLoss(settings, row.price, settings.enableMouseClickSilentOrders));

      return;
    }

    if (!e.shiftKey && !e.ctrlKey) {
      this.callWithSettings(settings => {
        this.callWithWorkingVolume(workingVolume => {
          this.scalperOrdersService.placeLimitOrder(
            settings,
            row.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell,
            workingVolume,
            row.price,
            settings.enableMouseClickSilentOrders
          );
        });
      });
    }
  }

  onRowRightClick(event: MouseEvent, row: ScalperOrderBookRowView) {
    event.preventDefault();
    event.stopPropagation();

    if (row.rowType !== this.rowTypes.Bid && row.rowType !== this.rowTypes.Ask) {
      return;
    }

    this.callWithSettings(settings => {
      this.callWithWorkingVolume(workingVolume => {
        this.scalperOrdersService.placeMarketOrder(
          settings,
          row.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy,
          workingVolume,
          settings.enableMouseClickSilentOrders
        );
      });
    });
  }

  private callWithSettings(action: (settings: ScalperOrderBookSettings) => void) {
    this.settings$!.pipe(
      take(1)
    ).subscribe(s => action(s));
  }

  private callWithWorkingVolume(action: (workingVolume: number) => void) {
    this.activeWorkingVolume$.pipe(
      take(1),
      filter(workingVolume => !!workingVolume)
    ).subscribe(workingVolume => action(workingVolume!));
  }

  private callWithCurrentOrderBook(action: (orderBook: ScalperOrderBookView) => void) {
    this.orderBook$.pipe(
      take(1)
    ).subscribe(action);
  }

  private subscribeToHotkeys() {
    this.settings$?.pipe(
      mapWith(
        () => this.hotkeysService.commands$,
        (settings, command) => ({ settings, command })
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ settings, command }) => {
      if (this.handleCommonCommands(command)) {
        return;
      }

      if (settings.disableHotkeys) {
        return;
      }

      if (this.handleAllCommands(command)) {
        return;
      }

      if (!this.isActiveOrderBook) {
        return;
      }

      this.handleCurrentOrderBookCommands(command);
    });
  }

  private handleCommonCommands(command: TerminalCommand): boolean {
    if (command.type === ScalperOrderBookCommands.centerOrderBook) {
      setTimeout(() => this.alignBySpread(), 0);
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

    if (command.type === ScalperOrderBookCommands.sellMarket) {
      this.placeMarketOrderSilent(Side.Sell);
      return;
    }

    if (command.type === ScalperOrderBookCommands.buyMarket) {
      this.placeMarketOrderSilent(Side.Buy);
      return;
    }

    if (command.type === ScalperOrderBookCommands.reversePositionsByMarketCurrent) {
      this.callWithSettings(settings => this.scalperOrdersService.reversePositionsByMarket(settings));
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
        this.scalperOrdersService.placeMarketOrder(settings, side, workingVolume, true);
      });
    });
  }

  private closePositionsByMarket() {
    this.callWithSettings(settings => this.scalperOrdersService.closePositionsByMarket(settings));
  }

  private subscribeToWorkingVolumesChange() {
    this.terminalSettingsService.getSettings().pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) =>
        prev.hotKeysSettings?.workingVolumes?.length === curr.hotKeysSettings?.workingVolumes?.length),
      withLatestFrom(this.settings$!.pipe(take(1))),
    ).subscribe(([terminalSettings, settings]) => {
      this.settingsService.updateSettings(this.guid, {
        workingVolumes: terminalSettings.hotKeysSettings?.workingVolumes
        ?.map((wv, i) => settings.workingVolumes[i] || 10 ** i)
      });
    });

    this.settings$!.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.workingVolumes = settings.workingVolumes;

      if (!this.activeWorkingVolume$.getValue()) {
        this.activeWorkingVolume$.next(this.workingVolumes[0]);
      }
    });
  }

  private placeBestOrder(side: Side) {
    this.callWithSettings(settings => {
      this.callWithCurrentOrderBook(orderBook => {
        this.callWithWorkingVolume(workingVolume => {
          this.scalperOrdersService.placeBestOrder(settings, side, workingVolume!, orderBook.rows);
        });
      });
    });
  }

  private alignBySpread() {
    let targetElement: Element | null;
    const spreadElements = this.elementRef.nativeElement.querySelectorAll('.spread-row');
    if (spreadElements.length > 0) {
      targetElement = spreadElements.item(Math.floor(spreadElements.length / 2));
    } else {
      targetElement = this.elementRef.nativeElement.querySelector('.best-row');
    }

    if (!!targetElement) {
      targetElement.scrollIntoView({ block: 'center', inline: 'center' });
    }
  }

  private getVolumeHighlightOption(settings: ScalperOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
    .sort((a, b) => b.boundary - a.boundary)
    .find(x => volume >= x.boundary);
  }

  private toViewModel(settings: ScalperOrderBookSettings, instrumentInfo: Instrument, orderBook: ScalperOrderBook): ScalperOrderBookView {
    const displayYield = settings.showYieldForBonds && getTypeByCfi(instrumentInfo.cfiCode) === InstrumentType.Bond;

    const asks = this.toVerticalOrderBookRowView(
      orderBook.asks,
      ScalperOrderBookRowType.Ask,
      item => displayYield ? item.yield : item.price,
      settings
    );

    if (asks.length > 0) {
      asks[asks.length - 1].isBest = true;
    }

    const bids = this.toVerticalOrderBookRowView(
      orderBook.bids,
      ScalperOrderBookRowType.Bid,
      item => displayYield ? item.yield : item.price,
      settings
    );

    if (bids.length > 0) {
      bids[0].isBest = true;
    }

    const spreadItems = this.toVerticalOrderBookRowView(
      orderBook.spreadItems ?? [],
      ScalperOrderBookRowType.Spread,
      item => item.price,
      settings
    );


    return {
      rows: [...asks, ...spreadItems, ...bids],
      allActiveOrders: orderBook.allActiveOrders
    } as ScalperOrderBookView;
  }

  private toVerticalOrderBookRowView(
    items: OrderBookItem[],
    rowType: ScalperOrderBookRowType,
    displayValueSelector: (item: OrderBookItem) => number | undefined,
    settings: ScalperOrderBookSettings): ScalperOrderBookRowView[] {
    return items.map(x => ({
        ...x,
        currentOrders: x.currentOrders ?? [],
        rowType: rowType,
        displayValue: displayValueSelector(x),
        getVolumeStyle: () => this.getVolumeStyle(rowType, x.volume ?? 0, settings)
      } as ScalperOrderBookRowView)
    ).sort((a, b) => b.displayValue - a.displayValue);
  }
}
