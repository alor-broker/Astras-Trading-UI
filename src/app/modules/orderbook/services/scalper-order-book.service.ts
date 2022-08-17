import { Injectable } from '@angular/core';
import { BaseWebsocketService } from "../../../shared/services/base-websocket.service";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { Store } from "@ngrx/store";
import {
  combineLatest,
  filter,
  Observable,
  of
} from "rxjs";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { getSelectedPortfolio } from "../../../store/portfolios/portfolios.selectors";
import { ScalperOrderBookSettings } from "../../../shared/models/settings/scalper-order-book-settings.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import {
  OrderBookItem,
  ScalperOrderBook
} from "../models/scalper-order-book.model";
import {
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import { OrderbookData } from "../models/orderbook-data.model";
import { OrderBookDataFeedHelper } from "../utils/order-book-data-feed.helper";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Order } from "../../../shared/models/orders/order.model";
import { OrderbookDataRow } from "../models/orderbook-data-row.model";
import { Side } from "../../../shared/models/enums/side.model";
import { getTypeByCfi } from "../../../shared/utils/instruments";
import { InstrumentType } from "../../../shared/models/enums/instrument-type.model";
import { MathHelper } from "../../../shared/utils/math-helper";

@Injectable()
export class ScalperOrderBookService extends BaseWebsocketService {
  private readonly currentOrders: Map<string, Order> = new Map<string, Order>();

  constructor(
    ws: WebsocketService,
    private readonly store: Store
  ) {
    super(ws);
  }

  getOrderBookRealtimeData(settings: ScalperOrderBookSettings, instrument: Instrument): Observable<ScalperOrderBook> {
    const obData$ = this.getEntity<OrderbookData>(OrderBookDataFeedHelper.getRealtimeDateRequest(
      settings.guid,
      settings.symbol,
      settings.exchange,
      settings.instrumentGroup,
      settings.depth));

    return combineLatest([
      obData$,
      this.getCurrentOrders(settings, settings.guid)
    ]).pipe(
      map(([ob, orders]) => this.toScalperOrderBook(settings, instrument, ob, orders))
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.store.select(getSelectedPortfolio)
    .pipe(
      filter((p): p is PortfolioKey => !!p)
    );
  }

  private getCurrentOrders(instrument: InstrumentKey, trackId: string): Observable<Order[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap((p) => {
        if (p) {
          return this.getPortfolioEntity<Order>(
            p.portfolio,
            p.exchange,
            'OrdersGetAndSubscribeV2',
            trackId
          ).pipe(
            filter(order => order.symbol === instrument.symbol),
            map((order: Order) => {
              this.currentOrders.set(order.id, order);
              return Array.from(this.currentOrders.values()).sort((o1, o2) =>
                o2.id.localeCompare(o1.id)
              );
            })
          );
        }

        return of([]);
      }),
      startWith([])
    );
  }

  private toScalperOrderBook(
    settings: ScalperOrderBookSettings,
    instrument: Instrument,
    orderBookData: OrderbookData,
    currentOrders: Order[]) {

    const toOrderBookItems = (dataRows: OrderbookDataRow[], side: Side) => dataRows.map(x => ({
      price: x.p,
      volume: x.v,
      yield: x.y,
      currentOrders: OrderBookDataFeedHelper.getCurrentOrdersForItem(x.p, side, currentOrders)
    } as OrderBookItem));

    const allActiveOrders = currentOrders
    .filter(order => order.status === 'working')
    .map(order => OrderBookDataFeedHelper.orderToCurrentOrder(order));

    let asks = toOrderBookItems(orderBookData.a, Side.Sell).sort((a, b) => a.price - b.price);
    let bids = toOrderBookItems(orderBookData.b, Side.Buy).sort((a, b) => b.price - a.price);

    if (getTypeByCfi(instrument.cfiCode) === InstrumentType.Bond || !instrument.minstep) {
      return {
        asks,
        bids,
        spreadItems: [],
        allActiveOrders: allActiveOrders
      } as ScalperOrderBook;
    }

    if (settings.showZeroVolumeItems && !!settings.depth) {
      asks = this.generateSequentialItems(asks, settings.depth, instrument.minstep);
      bids = this.generateSequentialItems(bids, settings.depth, -instrument.minstep);
    }

    let spreadItems: OrderBookItem[] = [];
    if (settings.showSpreadItems && asks.length > 0 && bids.length > 0) {
      spreadItems = this.generateSpread(
        Math.min(asks[0].price, bids[0].price),
        Math.max(asks[0].price, bids[0].price),
        instrument.minstep
      );
    }

    return {
      asks,
      bids,
      spreadItems,
      allActiveOrders: allActiveOrders
    } as ScalperOrderBook;
  }

  private generateSpread(startValue: number, endValue: number, step: number): OrderBookItem[] {
    if (startValue === endValue) {
      return [];
    }

    const pricePrecision = MathHelper.getPrecision(step);
    const itemsCountToGenerate = Math.round((endValue - startValue) / step) - 1;
    if (itemsCountToGenerate <= 0) {
      return [];
    }

    return [...Array(itemsCountToGenerate).keys()]
    .map(i => startValue + ((i + 1) * step))
    .map(x => MathHelper.round(x, pricePrecision))
    .map(x => ({
      price: x,
      currentOrders: []
    } as OrderBookItem));
  }

  private generateSequentialItems(items: OrderBookItem[], count: number, step: number) {
    if (items.length === 0) {
      return [];
    }

    return this.generatePriceSequence(items[0].price, count, step)
    .map(x => {
      const existedItem = items.find(i => i.price === x);
      return {
        price: x,
        volume: undefined,
        currentOrders: [],
        ...existedItem
      } as OrderBookItem;
    });
  }

  private generatePriceSequence(startValue: number, length: number, step: number) {
    const pricePrecision = MathHelper.getPrecision(step);
    return [...Array(length).keys()]
    .map(i => startValue + (i * step))
    .map(x => MathHelper.round(x, pricePrecision));
  }
}
