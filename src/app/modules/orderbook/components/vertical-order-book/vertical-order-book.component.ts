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
  filter,
  forkJoin,
  Observable,
  of,
  shareReplay,
  skip,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  distinctUntilChanged
} from "rxjs";
import {
  CurrentOrder,
  OrderBookItem,
  VerticalOrderBook,
  VerticalOrderBookRowType,
  VerticalOrderBookRowView
} from "../../models/vertical-order-book.model";
import {
  VerticalOrderBookSettings,
  VolumeHighlightOption
} from "../../../../shared/models/settings/vertical-order-book-settings.model";
import { map, startWith } from "rxjs/operators";
import { buyColorBackground, sellColorBackground } from "../../../../shared/models/settings/styles-constants";
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

@Component({
  selector: 'ats-vertical-order-book[guid][shouldShowSettings]',
  templateUrl: './vertical-order-book.component.html',
  styleUrls: ['./vertical-order-book.component.less']
})
export class VerticalOrderBookComponent implements OnInit, OnDestroy {
  rowTypes = VerticalOrderBookRowType;
  maxVolume: number = 1;
  workingVolumes: number[] = [];
  activeWorkingVolume$ = new BehaviorSubject<number | null>(null);

  isActiveOrderBook = false;

  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;

  orderBookRows$!: Observable<VerticalOrderBookRowView[]>;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$: Observable<VerticalOrderBookSettings> | null = null;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly orderBookService: OrderbookService,
    private readonly instrumentsService: InstrumentsService,
    private readonly hotkeysService: OrderbookHotKeysService,
    private readonly commandsService: CommandsService,
    private readonly notification: NzNotificationService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly elementRef: ElementRef<HTMLElement>
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(shareReplay());
    const getInstrumentInfo = (settings: VerticalOrderBookSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    this.orderBookRows$ = this.settings$.pipe(
      take(1),
      mapWith(
        settings => getInstrumentInfo(settings),
        (settings, instrument) => ({ settings, instrument })
      ),
      mapWith(
        ({ settings, instrument }) => this.orderBookService.getVerticalOrderBook(settings, instrument),
        ({ settings, instrument }, orderBook) => ({ settings, instrument, orderBook })
      ),
      map(x => this.toViewModel(x.settings, x.instrument, x.orderBook)),
      tap(orderBookRows => {
        this.maxVolume = Math.max(...orderBookRows.map(x => x.volume ?? 0));
      }),
      startWith([]),
      shareReplay()
    );

    this.subscribeToHotkeys();
    this.susbscribeToWorkingVolumesChange();

      this.orderBookRows$.pipe(
        take(2),
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

  getVolumeStyle(rowType: VerticalOrderBookRowType, volume: number, settings: VerticalOrderBookSettings) {
    if (rowType !== VerticalOrderBookRowType.Ask && rowType !== VerticalOrderBookRowType.Bid || !volume) {
      return null;
    }

    if (!settings.highlightHighVolume) {
      const size = 100 * (volume / this.maxVolume);
      const color = rowType === VerticalOrderBookRowType.Bid
        ? buyColorBackground
        : sellColorBackground;

      return {
        background: `linear-gradient(90deg, ${color} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    }

    const volumeHighlightOption = this.getVolumeHighlightOption(settings, volume);
    if(!volumeHighlightOption) {
      return null;
    }

    const size = 100 * (volume / volumeHighlightOption.boundary);

    return {
      background: `linear-gradient(90deg, ${volumeHighlightOption.color}BF ${size}% , rgba(0,0,0,0) ${size}%)`
    };
  }

  cancelAllOrders() {
    this.orderBookRows$
      .pipe(skip(1), take(1))
      .subscribe(rows =>
        rows
          .filter(row => row.currentOrders.length)
          .forEach(row => this.cancelOrders(row.currentOrders))
      );
  }

  cancelOrders(orders: CurrentOrder[]) {
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

  addStopOrder(e: MouseEvent, row: VerticalOrderBookRowView) {
    if (e.ctrlKey && row.rowType !== this.rowTypes.Spread) {
      this.settings$!
        .pipe(
          take(1),
          switchMap(settings =>
            this.commandsService.placeOrder(
              'stopLimit',
              row.rowType === this.rowTypes.Ask ? Side.Sell : Side.Buy,
              {
                side: row.rowType === this.rowTypes.Ask
                  ? 'sell'
                  : 'buy',
                quantity: this.activeWorkingVolume$.getValue() || 1,
                price: row.price,
                instrument: {
                  symbol: settings.symbol,
                  exchange: settings.exchange,
                  instrumentGroup: settings.instrumentGroup,
                },
                triggerPrice: row.price,
                condition: row.rowType === this.rowTypes.Ask ? StopOrderCondition.More : StopOrderCondition.Less,
              }
            )
          )
        )
        .subscribe();
    }

    if (e.shiftKey && row.rowType === this.rowTypes.Ask) {
      this.settings$!
        .pipe(
          take(1),
          mapWith(
            s => this.orderBookService.getOrderBookPositions(s),
            (settings, positions) => ({ settings, positions })
          ),
          map(({settings, positions}) => ({
              quantity: positions
                .map(pos => pos.qtyTFuture)
                .reduce((acc, curr) => acc + curr, 0),
              settings
            })
          ),
          switchMap(({quantity, settings}) => {
            if (!quantity) {
              this.notification.error('Нет позиций', 'Позиции с данным тикером отсутствуют');
              return of({});
            }
            return this.commandsService.placeOrder('stop',Side.Sell, {
              side: 'sell',
              quantity,
              price: null,
              instrument: {
                symbol: settings.symbol,
                exchange: settings.exchange,
                instrumentGroup: settings.instrumentGroup,
              },
              triggerPrice: row.price,
              condition: StopOrderCondition.More,
            });
          })
        )
        .subscribe();
    }
  }

  private subscribeToHotkeys() {
    this.hotkeysService.orderBookEventSub
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(e => {
        switch (e.event) {
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

        if (e.event === 'cancelOrderbookOrders') {
          this.cancelAllOrders();
        }
        if (e.event === 'closeOrderbookPositions') {
          this.closePositions();
        }
        if (e.event === 'reverseOrderbookPositions') {
          this.closePositions(true);
        }
        if (e.event.includes('selectWorkingVolume')) {
          this.selectVol(this.workingVolumes[e.options]);
        }
        if (e.event === 'sell' || e.event === 'buy') {
          this.sellOrBuyBestOrder(e as any);
        }
        if (e.event === 'placeMarketOrder') {
          this.placeMarketOrder(e as any);
        }
      });
  }

  private susbscribeToWorkingVolumesChange() {
    this.terminalSettingsService.getSettings()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) =>
          prev.hotKeysSettings?.workingVolumes?.length === curr.hotKeysSettings?.workingVolumes?.length),
        mapWith(
          () => this.settings$!.pipe(take(1)),
          (terminalSettings, settings) => ({terminalSettings, settings})
        )
      )
      .subscribe(({terminalSettings, settings}) => {
        this.settingsService.updateSettings(this.guid, {
          workingVolumes: terminalSettings.hotKeysSettings?.workingVolumes
            ?.map((wv, i) => settings.workingVolumes[i] || 10 ** i)
        });
      });

    this.settings$!.subscribe(settings => {
      this.workingVolumes = settings.workingVolumes;

      if (!this.activeWorkingVolume$.getValue()) {
        this.activeWorkingVolume$.next(this.workingVolumes[0]);
      }
    });
  }

  private sellOrBuyBestOrder(e: {event: string}) {
    forkJoin([
      this.orderBookRows$.pipe(skip(1), take(1)),
      this.settings$!.pipe(take(1))
    ])
      .pipe(
        switchMap(([rows, settings]) => {
          const spreadRows = rows.filter(r => r.rowType === this.rowTypes.Spread).map(r => r.price);
          let price: number;

          if (spreadRows.length) {
            price = e.event === 'sell' ? <number>spreadRows.shift() : <number>spreadRows.pop();
          } else {
            price = e.event === 'sell'
              ? <number>rows.filter(r => r.rowType === this.rowTypes.Ask).map(r => r.price).pop()
              : <number>rows.filter(r => r.rowType === this.rowTypes.Bid).map(r => r.price).shift();
          }

          return this.commandsService.placeOrder('limit', e.event === 'sell' ? Side.Sell : Side.Buy,{
            side: e.event,
            quantity: this.activeWorkingVolume$.getValue() || 1,
            price,
            instrument: {
              symbol: settings.symbol,
              exchange: settings.exchange,
              instrumentGroup: settings.instrumentGroup,
            },
          });
        })
      )
      .subscribe();
  }

  private placeMarketOrder(e: { options: { side: string } }) {
    this.settings$!
      .pipe(switchMap(s =>
        this.commandsService.placeOrder('market', e.options.side === 'sell' ? Side.Sell : Side.Buy, {
          side: e.options.side,
          quantity: this.activeWorkingVolume$.getValue() || 1,
          instrument: {
            symbol: s.symbol,
            exchange: s.exchange
          },
        })
      )).subscribe();
  }

  alignBySpread() {
    let targetElement: Element | null = null;
    const spreadElements = this.elementRef.nativeElement.querySelectorAll('.spread-row');
    if(spreadElements.length > 0) {
      targetElement = spreadElements.item(Math.floor(spreadElements.length / 2));
    } else {
      targetElement = this.elementRef.nativeElement.querySelector('.best-row');
    }

    if(!!targetElement) {
      targetElement.scrollIntoView({block: 'center', inline: 'center', behavior: 'smooth'});
    }
  }

  private getVolumeHighlightOption(settings: VerticalOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => a.boundary - b.boundary)
      .find(x => volume <= x.boundary);
  }

  private toViewModel(settings: VerticalOrderBookSettings, instrumentInfo: Instrument, orderBook: VerticalOrderBook): VerticalOrderBookRowView[] {
    const displayYield = settings.showYieldForBonds && getTypeByCfi(instrumentInfo.cfiCode) === InstrumentType.Bond;

    const asks = this.toVerticalOrderBookRowView(
      orderBook.asks,
      VerticalOrderBookRowType.Ask,
      item => displayYield ? item.yield : item.price,
      settings
    );

    if (asks.length > 0) {
      asks[asks.length - 1].isBest = true;
    }

    const bids = this.toVerticalOrderBookRowView(
      orderBook.bids,
      VerticalOrderBookRowType.Bid,
      item => displayYield ? item.yield : item.price,
      settings
    );

    if (bids.length > 0) {
      bids[0].isBest = true;
    }

    const spreadItems = this.toVerticalOrderBookRowView(
      orderBook.spreadItems ?? [],
      VerticalOrderBookRowType.Spread,
      item => item.price,
      settings
    );


    return [...asks, ...spreadItems, ...bids];
  }

  private toVerticalOrderBookRowView(
    items: OrderBookItem[],
    rowType: VerticalOrderBookRowType,
    displayValueSelector: (item: OrderBookItem) => number | undefined,
    settings: VerticalOrderBookSettings): VerticalOrderBookRowView[] {
    return items.map(x => ({
        ...x,
        currentOrders: x.currentOrders ?? [],
        rowType: rowType,
        displayValue: displayValueSelector(x),
        getVolumeStyle: () => this.getVolumeStyle(rowType, x.volume ?? 0, settings)
      } as VerticalOrderBookRowView)
    ).sort((a, b) => b.displayValue - a.displayValue);
  }
}
