import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookService } from "../../services/orderbook.service";
import {
  BehaviorSubject,
  filter,
  forkJoin,
  Observable,
  of,
  shareReplay, skip,
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
import { getSelectedPortfolio } from "../../../../store/portfolios/portfolios.selectors";
import { Store } from "@ngrx/store";
import { StopOrderCondition } from "../../../../shared/models/enums/stoporder-conditions";
import { AuthService } from "../../../../shared/services/auth.service";
import { User } from "../../../../shared/models/user/user.model";
import { PositionsService } from "../../../../shared/services/positions.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { Position } from "../../../../shared/models/positions/position.model";
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
    private readonly store: Store,
    private readonly authService: AuthService,
    private readonly positionsService: PositionsService,
    private readonly notification: NzNotificationService,
    private readonly terminalSettingsService: TerminalSettingsService
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
      startWith([])
    );

    this.hotkeysService.orderBookEventSub
      .pipe(
        tap(e => {
          switch (e.event) {
            case 'cancelAllOrders':
              this.cancelAllOrders();
              break;
            case 'closeAllPositions':
              this.closePositions(e.options);
              break;
          }
        }),
        filter(() => this.isActiveOrderBook),
        takeUntil(this.destroy$)
      )
      .subscribe(e => {
        if (e.event === 'cancelOrderbookOrders') {
          this.cancelAllOrders();
        }
        if (e.event === 'closeOrderbookPositions') {
          this.closePositions(e.options);
        }
        if (e.event === 'reverseOrderbookPositions') {
          this.closePositions(e.options, true);
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
            ?.map((wv, i) => settings.workingVolumes[i] || 10**i)
        });
      });

      this.settings$.subscribe(settings => {
        this.workingVolumes = settings.workingVolumes;

        if (!this.activeWorkingVolume$.getValue()) {
          this.activeWorkingVolume$.next(this.workingVolumes[0]);
        }
      });
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

  closeOrderBookPositions(positions: Position[]) {
    this.settings$!
      .pipe(
        take(1),
        map(s => positions.filter(
          pos => s.exchange === pos.exchange && s.symbol === pos.symbol
        ))
      )
      .subscribe((positions: Position[]) =>
        positions.forEach(pos => {
          if (!pos.qtyTFuture) {
            return;
          }

          this.commandsService.placeOrder('market', pos.qtyTFuture > 0 ? Side.Sell : Side.Buy, {
            side: pos.qtyTFuture > 0 ? 'sell' : 'buy',
            quantity: Math.abs(pos.qtyTFuture),
            instrument: {symbol: pos.symbol, exchange: pos.exchange},
            user: {portfolio: pos.portfolio, exchange: pos.exchange}
          }).subscribe();
        })
      );
  }

  closePositions(positions: Position[], isReversePosition = false) {
    this.settings$!
      .pipe(
        take(1),
        map(s => ({
            positions: positions.filter(
              pos => s.exchange === pos.exchange && s.symbol === pos.symbol
            ),
            isReversePosition: isReversePosition
          })
        )
      )
      .subscribe((options: {positions: Position[], isReversePosition: boolean}) =>
        options.positions.forEach(pos => {
          if (!pos.qtyTFuture) {
            return;
          }

          this.commandsService.placeOrder('market', pos.qtyTFuture > 0 ? Side.Sell : Side.Buy, {
            side: pos.qtyTFuture > 0 ? 'sell' : 'buy',
            quantity: Math.abs(options.isReversePosition ? pos.qtyTFuture * 2 : pos.qtyTFuture),
            instrument: {symbol: pos.symbol, exchange: pos.exchange},
            user: {portfolio: pos.portfolio, exchange: pos.exchange}
          }).subscribe();
        })
      );
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
                  symbol: (settings as VerticalOrderBookSettings).symbol,
                  exchange: (settings as VerticalOrderBookSettings).exchange,
                  instrumentGroup: (settings as VerticalOrderBookSettings).instrumentGroup,
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
      this.authService.currentUser$
        .pipe(
          map((user: User) => user.login),
          switchMap(login => this.positionsService.getAllByLogin(login).pipe(take(1))),
          mapWith(() =>
              this.settings$!
                .pipe(
                  take(1),
                  mapWith(
                    () => this.store.select(getSelectedPortfolio).pipe(take(1)),
                    (settings, portfolio) => ({settings, portfolio})
                  )
                ),
            (positions, {settings, portfolio}) => ({
              quantity: positions
                .filter(pos =>
                  pos.symbol === (settings as VerticalOrderBookSettings).symbol &&
                  pos.exchange === (settings as VerticalOrderBookSettings).exchange &&
                  pos.portfolio === portfolio!.portfolio)
                .map(pos => pos.qtyTFuture)
                .reduce((acc, curr) => acc + curr, 0),
              settings,
              portfolio
            })
          ),
          switchMap(({quantity, settings, portfolio}) => {
            if (!quantity) {
              this.notification.error('Нет позиций', 'Позиции с данным тикером отсутствуют');
              return of({});
            }
            return this.commandsService.placeOrder('stop',Side.Sell, {
              side: 'sell',
              quantity,
              price: null,
              instrument: {
                symbol: (settings as VerticalOrderBookSettings).symbol,
                exchange: (settings as VerticalOrderBookSettings).exchange,
                instrumentGroup: (settings as VerticalOrderBookSettings).instrumentGroup,
              },
              user: {
                portfolio: portfolio!.portfolio,
                exchange: (settings as VerticalOrderBookSettings).exchange,
              },
              triggerPrice: row.price,
              condition: StopOrderCondition.More,
            });
          })
        )
        .subscribe();
    }
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

  private placeMarketOrder(e: {options: {side: string, symbol: string, portfolio: string, exchange: string}}) {
    this.commandsService.placeOrder('market', e.options.side === 'sell' ? Side.Sell : Side.Buy,{
      side: e.options.side,
      quantity: this.activeWorkingVolume$.getValue() || 1,
      instrument: {
        symbol: e.options.symbol,
        exchange: e.options.exchange
      },
      user: {portfolio: e.options.portfolio, exchange: e.options.exchange}
    }).subscribe();
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
