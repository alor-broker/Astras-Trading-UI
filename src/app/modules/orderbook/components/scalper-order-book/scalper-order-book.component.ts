import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookService } from "../../services/orderbook.service";
import {
  BehaviorSubject,
  delay,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
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
  ScalperOrderBookRowView
} from "../../models/scalper-order-book.model";
import {
  ScalperOrderBookSettings,
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
import { CancelCommand } from "../../../../shared/models/commands/cancel-command.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { getTypeByCfi } from "../../../../shared/utils/instruments";
import { InstrumentType } from "../../../../shared/models/enums/instrument-type.model";
import { OrderbookHotKeysService } from "../../../../shared/services/orderbook-hot-keys.service";
import { CommandsService } from "../../../command/services/commands.service";
import { Side } from "../../../../shared/models/enums/side.model";
import { StopOrderCondition } from "../../../../shared/models/enums/stoporder-conditions";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { StopCommand } from "../../../command/models/stop-command.model";
import { CommandParams } from "../../../../shared/models/commands/command-params.model";
import { isEqualScalperOrderBookSettings } from "../../../../shared/utils/settings-helper";

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

  orderBookRows$!: Observable<ScalperOrderBookRowView[]>;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$: Observable<ScalperOrderBookSettings> | null = null;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly orderBookService: OrderbookService,
    private readonly instrumentsService: InstrumentsService,
    private readonly hotkeysService: OrderbookHotKeysService,
    private readonly commandsService: CommandsService,
    private readonly notification: NzNotificationService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly modal: ModalService,
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

    this.orderBookRows$ = this.settings$.pipe(
      mapWith(
        settings => getInstrumentInfo(settings),
        (settings, instrument) => ({ settings, instrument })
      ),
      mapWith(
        ({ settings, instrument }) => this.orderBookService.getScalperOrderBook(settings, instrument),
        ({ settings, instrument }, orderBook) => ({ settings, instrument, orderBook })
      ),
      map(x => this.toViewModel(x.settings, x.instrument, x.orderBook)),
      tap(orderBookRows => {
        this.maxVolume = Math.max(...orderBookRows.map(x => x.volume ?? 0));
      }),
      startWith([]),
      shareReplay(1)
    );

    this.subscribeToHotkeys();
    this.subscribeToWorkingVolumesChange();

    this.orderBookRows$.pipe(
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

    if (!settings.highlightHighVolume) {
      const size = 100 * (volume / this.maxVolume);
      const color = rowType === ScalperOrderBookRowType.Bid
        ? buyColorBackground
        : sellColorBackground;

      return {
        background: `linear-gradient(90deg, ${color} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    }

    const volumeHighlightOption = this.getVolumeHighlightOption(settings, volume);
    if (!volumeHighlightOption) {
      return null;
    }

    const size = 100 * (volume / volumeHighlightOption.boundary);

    return {
      background: `linear-gradient(90deg, ${volumeHighlightOption.color}BF ${size}% , rgba(0,0,0,0) ${size}%)`
    };
  }

  cancelAllOrders() {
    this.orderBookRows$
      .pipe(take(1))
      .subscribe(rows =>
        rows
          .filter(row => row.currentOrders.length)
          .forEach(row => this.cancelOrders(row.currentOrders))
      );
  }

  cancelOrders(orders: CurrentOrder[], e?: MouseEvent,) {
    e?.preventDefault();
    e?.stopPropagation();

    for (const order of orders) {
      this.orderBookService.cancelOrder({
        orderid: order.orderId,
        exchange: order.exchange,
        portfolio: order.portfolio,
        stop: false
      } as CancelCommand);
    }
  }

  closePositions(isReversePosition = false) {
    this.settings$!.pipe(take(1))
      .subscribe(s => this.orderBookService.closeOrderBookPositions(s, isReversePosition));
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
      this.settings$!.pipe(
        take(1),
        switchMap(settings => {
            const side = row.rowType === this.rowTypes.Ask ? Side.Sell : Side.Buy;
            const command = {
              side: side,
              quantity: this.activeWorkingVolume$.getValue() || 1,
              price: row.price,
              instrument: {
                symbol: settings.symbol,
                exchange: settings.exchange,
                instrumentGroup: settings.instrumentGroup,
              },
              triggerPrice: row.price,
              condition: row.rowType === this.rowTypes.Ask ? StopOrderCondition.More : StopOrderCondition.Less,
            } as StopCommand;

            return this.placeStopLimitOrder(command, settings.enableMouseClickSilentOrders);
          }
        )
      ).subscribe();

      return;
    }

    if (e.shiftKey && row.rowType === this.rowTypes.Ask) {
      this.settings$!.pipe(
        take(1),
        mapWith(
          s => this.orderBookService.getOrderBookPositions(s),
          (settings, positions) => ({ settings, positions })
        ),
        map(({ settings, positions }) => ({
            quantity: positions
              .map(pos => pos.qtyTFuture)
              .reduce((acc, curr) => acc + curr, 0),
            settings
          })
        ),
        switchMap(({ quantity, settings }) => {
          if (!quantity) {
            this.notification.error('Нет позиций', 'Позиции с данным тикером отсутствуют');
            return of({});
          }

          const command = {
            side: Side.Sell,
            quantity,
            instrument: {
              symbol: settings.symbol,
              exchange: settings.exchange,
              instrumentGroup: settings.instrumentGroup,
            },
            triggerPrice: row.price,
            condition: StopOrderCondition.More,
          } as StopCommand;

          return this.placeStopMarketOrder(command, settings.enableMouseClickSilentOrders);
        })
      ).subscribe();

      return;
    }

    if (!e.shiftKey && !e.ctrlKey) {
      this.settings$!.pipe(
        take(1)
      ).subscribe(settings => {
        this.placeLimitOrder(
          row.rowType === this.rowTypes.Bid ? Side.Buy : Side.Sell,
          row.price,
          settings.enableMouseClickSilentOrders);
      });

    }
  }

  onRowRightClick(event: MouseEvent, row: ScalperOrderBookRowView) {
    event.preventDefault();
    event.stopPropagation();

    if (row.rowType !== this.rowTypes.Bid && row.rowType !== this.rowTypes.Ask) {
      return;
    }

    this.settings$!.pipe(
      take(1)
    ).subscribe(settings => {
      this.placeMarketOrder(
        row.rowType === this.rowTypes.Bid ? Side.Sell : Side.Buy,
        settings.enableMouseClickSilentOrders);
    });
  }

  private subscribeToHotkeys() {
    this.settings$?.pipe(
      mapWith(
        () => this.hotkeysService.orderBookEventSub,
        (settings, hotkeyEvent) => ({ settings, hotkeyEvent })
      ),
      takeUntil(this.destroy$)
    ).subscribe(x => {
      const eventKey = x.hotkeyEvent.event;

      if (eventKey === 'centerOrderbookKey') {
        setTimeout(() => this.alignBySpread(), 0);
        return;
      }

      if (this.isActiveOrderBook && eventKey === 'selectWorkingVolume') {
        this.selectVol(this.workingVolumes[x.hotkeyEvent.options.workingVolumeIndex]);
      }

      if (x.settings.disableHotkeys) {
        return;
      }

      switch (eventKey) {
        case 'cancelAllOrders':
          this.cancelAllOrders();
          break;
        case 'closeAllPositions':
          this.closePositions();
          break;
      }

      if (!this.isActiveOrderBook) {
        return;
      }

      if (eventKey === 'cancelOrderbookOrders') {
        this.cancelAllOrders();
      }
      if (eventKey === 'closeOrderbookPositions') {
        this.closePositions();
      }
      if (eventKey === 'reverseOrderbookPositions') {
        this.closePositions(true);
      }
      if (eventKey === 'placeBestOrder') {
        this.placeBestOrder(x.hotkeyEvent.options.side);
      }
      if (eventKey === 'placeMarketOrder') {
        this.placeMarketOrder(x.hotkeyEvent.options.side, true);
      }
    });
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
    this.orderBookRows$
      .pipe(
        take(1),
      )
      .subscribe((rows) => {
        const spreadRows = rows.filter(r => r.rowType === this.rowTypes.Spread).map(r => r.price);
        let price: number;

        if (spreadRows.length) {
          price = side === Side.Sell ? <number>spreadRows.shift() : <number>spreadRows.pop();
        } else {
          price = side === Side.Sell
            ? <number>rows.filter(r => r.rowType === this.rowTypes.Ask).map(r => r.price).pop()
            : <number>rows.filter(r => r.rowType === this.rowTypes.Bid).map(r => r.price).shift();
        }

        this.placeLimitOrder(side, price, true);
      });
  }

  private placeMarketOrder(side: Side, isSilent: boolean) {
    this.settings$!.pipe(
      take(1),
      switchMap(s => {
          const command = {
            side: side,
            quantity: this.activeWorkingVolume$.getValue() || 1,
            instrument: {
              symbol: s.symbol,
              exchange: s.exchange
            },
          };

          if (isSilent) {
            return this.commandsService.placeOrder('market', side, command);
          }

          this.modal.openCommandModal({
            ...command,
            type: CommandType.Market
          } as CommandParams);

          return of({});
        }
      )).subscribe();
  }

  private placeLimitOrder(side: Side, price: number, isSilent: boolean) {
    this.settings$!.pipe(
      take(1),
      switchMap(s => {
          const command = {
            side,
            quantity: this.activeWorkingVolume$.getValue() || 1,
            price,
            instrument: {
              symbol: s.symbol,
              exchange: s.exchange
            },
          };

          if (isSilent) {
            return this.commandsService.placeOrder('limit', side, command);
          }

          this.modal.openCommandModal({
            ...command,
            type: CommandType.Limit
          });

          return of({});
        }
      )).subscribe();
  }

  private placeStopLimitOrder(command: StopCommand, isSilent: boolean): Observable<any> {
    if (isSilent) {
      return this.commandsService.placeOrder(
        'stopLimit',
        command.side,
        command
      );
    } else {
      this.modal.openCommandModal({
        ...command,
        type: CommandType.Stop,
        stopEndUnixTime: undefined
      });

      return of({});
    }
  }

  private placeStopMarketOrder(command: StopCommand, isSilent: boolean): Observable<any> {
    if (isSilent) {
      return this.commandsService.placeOrder(
        'stop',
        command.side,
        command
      );
    } else {
      this.modal.openCommandModal({
        ...command,
        type: CommandType.Stop,
        stopEndUnixTime: undefined,
        price: undefined
      });

      return of({});
    }
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
      .sort((a, b) => a.boundary - b.boundary)
      .find(x => volume <= x.boundary);
  }

  private toViewModel(settings: ScalperOrderBookSettings, instrumentInfo: Instrument, orderBook: ScalperOrderBook): ScalperOrderBookRowView[] {
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


    return [...asks, ...spreadItems, ...bids];
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
