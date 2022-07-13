import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookService } from "../../services/orderbook.service";
import {
  BehaviorSubject,
  filter,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap
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
import {
  map,
  startWith
} from "rxjs/operators";
import { buyColorBackground, sellColorBackground } from "../../../../shared/models/settings/styles-constants";
import { CancelCommand } from "../../../../shared/models/commands/cancel-command.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { getTypeByCfi } from "../../../../shared/utils/instruments";
import { InstrumentType } from "../../../../shared/models/enums/instrument-type.model";
import { HotKeysService } from "../../../../shared/services/hot-keys.service";
import { CommandsService } from "../../../command/services/commands.service";
import { Side } from "../../../../shared/models/enums/side.model";
import { getSelectedPortfolio } from "../../../../store/portfolios/portfolios.selectors";
import { Store } from "@ngrx/store";
import { StopOrderCondition } from "../../../../shared/models/enums/stoporder-conditions";
import { AuthService } from "../../../../shared/services/auth.service";
import { User } from "../../../../shared/models/user/user.model";
import { PositionsService } from "../../../../shared/services/positions.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";

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

  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;

  orderBookRows$!: Observable<VerticalOrderBookRowView[]>;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly orderBookService: OrderbookService,
    private readonly instrumentsService: InstrumentsService,
    private readonly hotkeysService: HotKeysService,
    private readonly commandsService: CommandsService,
    private readonly store: Store,
    private readonly authService: AuthService,
    private readonly positionsService: PositionsService,
    private readonly notification: NzNotificationService
  ) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(shareReplay());
    const getInstrumentInfo = (settings: VerticalOrderBookSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    this.orderBookRows$ = settings$.pipe(
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
        filter(e => e.guid === this.guid),
        takeUntil(this.destroy$)
      )
      .subscribe(e => {
        if (e.event.includes('selectWorkingVolume')) {
          this.selectVol(this.workingVolumes[e.options - 1]);
        }
        if (e.event === 'sell' || e.event === 'buy') {
            this.sellOrBuyBestOrder(e as any);
        }
        if (e.event === 'placeMarketOrder') {
          this.placeMarketOrder(e as any);
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

    return null;
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

  private getVolumeHighlightOption(settings: VerticalOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => a.boundary - b.boundary)
      .find(x => volume <= x.boundary);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  addStopOrder(e: MouseEvent, row: VerticalOrderBookRowView) {
    if (e.ctrlKey && row.rowType !== this.rowTypes.Spread) {
      this.settingsService.getSettings(this.guid)
        .pipe(
          take(1),
          mapWith(
            () => this.store.select(getSelectedPortfolio).pipe(take(1)),
            (settings, portfolio) => ({settings, portfolio})
          )
        )
        .subscribe(({settings, portfolio}) => {
          this.commandsService.setStopCommand({
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
            user: {
              portfolio: portfolio!.portfolio,
              exchange: (settings as VerticalOrderBookSettings).exchange,
            },
            triggerPrice: row.price,
            condition: row.rowType === this.rowTypes.Ask ? StopOrderCondition.More : StopOrderCondition.Less,
          });
          this.commandsService.submitStop(row.rowType === this.rowTypes.Ask ? Side.Sell : Side.Buy);
        });
    }

    if (e.shiftKey && row.rowType === this.rowTypes.Ask) {
      this.authService.currentUser$
        .pipe(
          map((user: User) => user.login),
          switchMap(login => this.positionsService.getAllByLogin(login).pipe(take(1))),
          mapWith(() =>
              this.settingsService.getSettings(this.guid)
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
          )
        )
        .subscribe(({quantity, settings, portfolio}) => {
          if (!quantity) {
            this.notification.error('Нет позиций', 'Позиции с данным тикером отсутствуют');
            return;
          }
          this.commandsService.setStopCommand({
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
          this.commandsService.submitStop(Side.Sell).subscribe();
        });
    }
  }

  activeOrderbookChanged(isActive: boolean) {
    this.hotkeysService.activeOrderbookChange(isActive ? this.guid : null);
  }

  private sellOrBuyBestOrder(e: {options: {settings: VerticalOrderBookSettings, portfolio: PortfolioKey}, event: string}) {
    this.orderBookRows$.pipe(take(1))
      .pipe(
        switchMap((rows) => {
          const bestRows = rows.filter(r => r.isBest).map(r => r.price);
          const price = e.event === 'sell'
            ? bestRows[0] > bestRows[1] ? bestRows[0] : bestRows[1]
            : bestRows[0] < bestRows[1] ? bestRows[0] : bestRows[1];

          this.commandsService.setLimitCommand({
            side: e.event,
            quantity: this.activeWorkingVolume$.getValue() || 1,
            price,
            instrument: {
              symbol: (e.options.settings as VerticalOrderBookSettings).symbol,
              exchange: (e.options.settings as VerticalOrderBookSettings).exchange,
              instrumentGroup: (e.options.settings as VerticalOrderBookSettings).instrumentGroup,
            },
            user: e.options.portfolio
          });
          return this.commandsService.submitLimit(e.event === 'sell' ? Side.Sell : Side.Buy);
        })
      )
      .subscribe();
  }

  private placeMarketOrder(e: {options: {side: string, symbol: string, portfolio: string, exchange: string}}) {
    this.commandsService.setMarketCommand({
      side: e.options.side,
      quantity: this.activeWorkingVolume$.getValue() || 1,
      instrument: {
        symbol: e.options.symbol,
        exchange: e.options.exchange
      },
      user: {portfolio: e.options.portfolio, exchange: e.options.exchange}
    });
    this.commandsService.submitMarket(e.options.side === 'sell' ? Side.Sell : Side.Buy).subscribe();
  }

  private getVolumeHighlightOption(settings: VerticalOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => a.boundary - b.boundary)
      .find(x => volume <= x.boundary);
  }

  private toViewModel(settings: VerticalOrderBookSettings, instrumentInfo: Instrument, orderBook: VerticalOrderBook): VerticalOrderBookRowView[] {
    this.workingVolumes = settings.workingVolumes;

    if (!this.activeWorkingVolume$.getValue()) {
      this.activeWorkingVolume$.next(this.workingVolumes[0]);
    }

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
