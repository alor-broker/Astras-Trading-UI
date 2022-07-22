import { Injectable } from '@angular/core';
import {
  combineLatest,
  filter,
  Observable,
  of,
  take
} from 'rxjs';
import {
  catchError,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import {
  ChartData,
  ChartPoint,
  OrderBook
} from '../models/orderbook.model';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { Order } from 'src/app/shared/models/orders/order.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { Store } from '@ngrx/store';
import { getSelectedPortfolio } from '../../../store/portfolios/portfolios.selectors';
import { ScalperOrderBookSettings } from "../../../shared/models/settings/scalper-order-book-settings.model";
import {
  CurrentOrder,
  OrderBookItem,
  ScalperOrderBook
} from "../models/scalper-order-book.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { OrderbookDataRow } from "../models/orderbook-data-row.model";
import { getTypeByCfi } from "../../../shared/utils/instruments";
import { InstrumentType } from "../../../shared/models/enums/instrument-type.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { Side } from "../../../shared/models/enums/side.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { PositionsService } from "../../../shared/services/positions.service";
import { CurrentPortfolioOrderService } from "../../../shared/services/current-portfolio-order.service";

@Injectable()
export class OrderbookService extends BaseWebsocketService {
  private ordersById: Map<string, Order> = new Map<string, Order>();

  constructor(
    ws: WebsocketService,
    private readonly store: Store,
    private readonly canceller: OrderCancellerService,
    private readonly positionsService: PositionsService,
    private readonly orderService: CurrentPortfolioOrderService,
  ) {
    super(ws);
  }

  getHorizontalOrderBook(settings: OrderbookSettings): Observable<OrderBook> {
    const obData$ = this.getOrderBookReq(settings.guid, settings.symbol, settings.exchange, settings.instrumentGroup, settings.depth).pipe(
      catchError((e,) => {
        throw e;
      }),
      map(ob => this.toOrderBook(ob))
    );

    return combineLatest([obData$, this.getOrders(settings, settings.guid)]).pipe(
      map(([ob, orders]) => {
        const withOrdersRows = ob.rows.map((row) => {
          const askOrders = !!row.ask ? this.getCurrentOrdersForItem(row.ask, Side.Sell, orders) : [];

          const sumAsk = askOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);
          const askCancels = askOrders.map(
            (o): CancelCommand => ({
              orderid: o.orderId,
              exchange: o.exchange,
              portfolio: o.portfolio,
              stop: false,
            })
          );

          const bidOrders = !!row.bid ? this.getCurrentOrdersForItem(row.bid, Side.Buy, orders) : [];
          const sumBid = bidOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);

          const bidCancels = bidOrders.map(
            (o): CancelCommand => ({
              orderid: o.orderId,
              exchange: o.exchange,
              portfolio: o.portfolio,
              stop: false,
            })
          );

          row.askOrderVolume = sumAsk;
          row.askCancels = askCancels;
          row.bidOrderVolume = sumBid;
          row.bidCancels = bidCancels;
          return row;
        });
        return { ...ob, rows: withOrdersRows };
      })
    );
  }

  getScalperOrderBook(settings: ScalperOrderBookSettings, instrument: Instrument): Observable<ScalperOrderBook> {
    const obData$ = this.getOrderBookReq(settings.guid, instrument.symbol, instrument.exchange, instrument.instrumentGroup, settings.depth);

    return combineLatest([obData$, this.getOrders(settings, settings.guid)]).pipe(
      map(([ob, orders]) => this.toScalperOrderBook(settings, instrument, ob, orders))
    );
  }

  cancelOrder(cancel: CancelCommand) {
    this.canceller.cancelOrder(cancel).subscribe();
  }

  closeOrderBookPositions(settings: ScalperOrderBookSettings, isReversePosition = false) {
    this.getOrderBookPositions(settings)
      .subscribe((positions: Position[]) =>
        positions.forEach(pos => {
          if (!pos.qtyTFuture) {
            return;
          }

          this.orderService.submitMarketOrder({
            side: pos.qtyTFuture > 0 ? Side.Sell : Side.Buy,
            quantity: Math.abs(isReversePosition ? pos.qtyTFuture * 2 : pos.qtyTFuture),
            instrument: { symbol: pos.symbol, exchange: pos.exchange },
          }).subscribe();
        })
      );
  }

  getOrderBookPositions(settings: ScalperOrderBookSettings): Observable<Position[]> {
    return this.store.select(getSelectedPortfolio).pipe(
      take(1),
      filter((p): p is PortfolioKey => !!p),
      switchMap(p => this.positionsService.getAllByPortfolio(p.portfolio, p.exchange)),
      map(positions => positions.filter(pos => pos.symbol === settings.symbol)
      )
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
      currentOrders: this.getCurrentOrdersForItem(x.p, side, currentOrders)
    } as OrderBookItem));

    let asks = toOrderBookItems(orderBookData.a, Side.Sell).sort((a, b) => a.price - b.price);
    let bids = toOrderBookItems(orderBookData.b, Side.Buy).sort((a, b) => b.price - a.price);

    if (getTypeByCfi(instrument.cfiCode) === InstrumentType.Bond || !instrument.minstep) {
      return {
        asks,
        bids,
        spreadItems: []
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
      spreadItems
    } as ScalperOrderBook;
  }

  private generatePriceSequence(startValue: number, length: number, step: number) {
    const pricePrecision = MathHelper.getPrecision(step);
    return [...Array(length).keys()]
      .map(i => startValue + (i * step))
      .map(x => MathHelper.round(x, pricePrecision));
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

  private toOrderBookRows(orderBookData: OrderbookData): OrderBookViewRow[] {
    return orderBookData.a.map((a, i) => {
      const obr: OrderBookViewRow = {
        ask: a.p,
        askVolume: a.v,
        yieldAsk: a.y,
        yieldBid: orderBookData.b[i]?.y ?? 0,
        bid: orderBookData.b[i]?.p ?? 0,
        bidVolume: orderBookData.b[i]?.v ?? 0,
      };

      return obr;
    });
  }

  private toOrderBook(orderBookData: OrderbookData): OrderBook {
    const rows = this.toOrderBookRows(orderBookData);
    const volumes = [
      ...rows.map((p) => p?.askVolume ?? 0),
      ...rows.map((p) => p?.bidVolume ?? 0),
    ];

    return {
      maxVolume: Math.max(...volumes),
      rows: rows,
      chartData: this.makeChartData(rows),
    } as OrderBook;
  }

  private getOrderBookReq(
    trackId: string,
    symbol: string,
    exchange: string,
    instrumentGroup?: string,
    depth?: number
  ): Observable<OrderbookData> {
    const request: OrderbookRequest = {
      opcode: 'OrderBookGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      depth: depth ?? 10,
      format: 'slim',
      guid: '',
      instrumentGroup: instrumentGroup,
    };
    request.guid = trackId;
    return this.getEntity<OrderbookData>(request);
  }

  private makeChartData(rows: OrderBookViewRow[]): ChartData {
    const asks = new Array<ChartPoint>(rows.length);
    const bids = new Array<ChartPoint>(rows.length);
    let j = 0;
    for (let k = rows.length - 1; k >= 0; k--) {
      const row = rows[k];
      j++;
      for (let i = 0; i < j; i++) {
        asks[i] = {
          y: (asks[i]?.y ?? 0) + (row?.askVolume ?? 0),
          x: asks[i]?.x ?? row?.ask ?? 0,
        };
        bids[i] = {
          y: (bids[i]?.y ?? 0) + (row?.bidVolume ?? 0),
          x: bids[i]?.x ?? row?.bid ?? 0,
        };
      }
    }
    const minPrice = Math.min(...bids.map(b => b.x));
    const maxPrice = Math.max(...asks.map(a => a.x));
    return {
      asks: asks,
      bids: bids,
      minPrice: minPrice,
      maxPrice: maxPrice
    };
  }

  private getOrders(instrument: InstrumentKey, trackId: string) {
    return this.store.select(getSelectedPortfolio).pipe(
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
              this.ordersById.set(order.id, order);
              return Array.from(this.ordersById.values()).sort((o1, o2) =>
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

  private getCurrentOrdersForItem(itemPrice: number, side: Side, orders: Order[]): CurrentOrder[] {
    const currentOrders = orders.filter(
      (o) => o.side === side
        && o.price === itemPrice
        && o.status === 'working'
    );

    return currentOrders.map(o => ({
      orderId: o.id,
      exchange: o.exchange,
      portfolio: o.portfolio,
      volume: o.qty
    } as CurrentOrder));
  }
}
