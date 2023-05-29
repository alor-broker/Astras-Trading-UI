import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { OrderFormUpdate, OrderFormValue, OrderType } from '../../models/order-form.model';
import { LimitOrderFormValue } from "../order-forms/limit-order-form/limit-order-form.component";
import { MarketOrderFormValue } from "../order-forms/market-order-form/market-order-form.component";
import { StopOrderFormValue } from "../order-forms/stop-order-form/stop-order-form.component";
import { Side } from "../../../../shared/models/enums/side.model";
import { LimitOrder, StopLimitOrder, StopMarketOrder, SubmitOrderResult } from "../../../command/models/order.model";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { finalize, map, startWith } from "rxjs/operators";
import { OrderService } from "../../../../shared/services/orders/order.service";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { Position } from "../../../../shared/models/positions/position.model";
import { Order } from '../../../../shared/models/orders/order.model';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { SubscriptionsDataFeedService } from '../../../../shared/services/subscriptions-data-feed.service';
import { OrderbookData, OrderbookRequest } from '../../../orderbook/models/orderbook-data.model';
import { OrderBookDataFeedHelper } from '../../../orderbook/utils/order-book-data-feed.helper';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { isArrayEqual } from '../../../../shared/utils/collections';
import { OrderSubmitSettings } from '../../models/order-submit-settings.model';
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { LessMore } from "../../../../shared/models/enums/less-more.model";
import { ExecutionPolicy } from "../../../../shared/models/orders/orders-group.model";

export enum ComponentTabs {
  LimitOrder = 'limitOrder',
  MarketOrder = 'marketOrder',
  StopOrder = 'stopOrder',
  Notifications = 'notifications'
}

@Component({
  selector: 'ats-order-submit[guid]',
  templateUrl: './order-submit.component.html',
  styleUrls: ['./order-submit.component.less']
})
export class OrderSubmitComponent implements OnInit, OnDestroy {
  readonly orderSides = Side;
  readonly componentTabs = ComponentTabs;
  readonly orderTypes = OrderType;
  @Input()
  guid!: string;
  currentInstrumentWithPortfolio$!: Observable<{ instrument: Instrument, portfolio: string }>;
  priceData$!: Observable<{ bid: number, ask: number }>;
  readonly canSubmitOrder$ = new BehaviorSubject(false);
  readonly buyButtonLoading$ = new BehaviorSubject(false);
  readonly sellButtonLoading$ = new BehaviorSubject(false);
  readonly initialValues$ = new BehaviorSubject<OrderFormUpdate<LimitOrderFormValue & MarketOrderFormValue & StopOrderFormValue>>(null);

  selectedTabIndex$!: Observable<number>;
  positionInfo$!: Observable<{ abs: number, quantity: number }>;
  activeLimitOrders$!: Observable<Order[]>;

  currentAskBid$!: Observable<{
    ask: { volume: number, price: number } | null,
    bid: { volume: number, price: number } | null,
  } | null>;

  settings$!: Observable<OrderSubmitSettings>;
  lastSelectedTab: ComponentTabs = ComponentTabs.LimitOrder;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private limitOrderFormValue: LimitOrderFormValue | null = null;
  private marketOrderFormValue: MarketOrderFormValue | null = null;
  private stopOrderFormValue: StopOrderFormValue | null = null;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly quotesService: QuotesService,
    private readonly orderService: OrderService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
  ) {
  }

  setSelectedTab(tab: ComponentTabs) {
    this.lastSelectedTab = tab;
    this.updateCanSubmitOrder();
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => this.isEqualOrderSubmitSettings(previous, current)),
      shareReplay(1)
    );

    const currentPortfolio$ = this.currentDashboardService.selectedPortfolio$.pipe(
      distinctUntilChanged((previous, current) => isPortfoliosEqual(previous, current)),
      map(p => p.portfolio),
    );

    const currentInstrument = this.settings$.pipe(
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      filter((i): i is Instrument => !!i)
    );

    this.currentInstrumentWithPortfolio$ = combineLatest([currentPortfolio$, currentInstrument]).pipe(
      tap(() => {
        this.setInitialValues(1, 1, undefined, this.stopOrderFormValue?.withLimit);
        this.limitOrderFormValue = null;
        this.marketOrderFormValue = null;
        this.stopOrderFormValue = null;
      }),
      map(([portfolio, instrument]) => ({instrument, portfolio})),
      shareReplay(1)
    );

    this.positionInfo$ = this.currentInstrumentWithPortfolio$.pipe(
      switchMap(data =>
        this.portfolioSubscriptionsService.getAllPositionsSubscription(data.portfolio, data.instrument.exchange)
          .pipe(
            map(x => x.find(p => p.symbol === data.instrument.symbol && p.exchange === data.instrument.exchange)),
          )
      ),
      filter((p): p is Position => !!p),
      map(p => ({
        abs: Math.abs(p.qtyTFutureBatch),
        quantity: p.qtyTFutureBatch
      })),
      startWith(({
        abs: 0,
        quantity: 0
      }))
    );

    this.priceData$ = this.currentInstrumentWithPortfolio$.pipe(
      switchMap(value => this.quotesService.getQuotes(value.instrument.symbol, value.instrument.exchange, value.instrument.instrumentGroup)),
      map(x => ({
        bid: x.bid,
        ask: x.ask
      }))
    );

    this.selectedTabIndex$ = this.currentInstrumentWithPortfolio$.pipe(
      tap(() => this.setSelectedTab(this.lastSelectedTab)),
      map(() => this.getFormIndexByType(this.lastSelectedTab))
    );

    this.widgetsDataProvider.getDataProvider<SelectedPriceData>('selectedPrice')
      ?.pipe(
        takeUntil(this.destroy$),
        withLatestFrom(this.settings$),
        filter(([priceData, settings]) => priceData.badgeColor === settings.badgeColor)
      )
      .subscribe(([priceData]) => this.setInitialValues(priceData.price));

    this.activeLimitOrders$ = this.currentInstrumentWithPortfolio$.pipe(
      mapWith(
        x => this.portfolioSubscriptionsService.getOrdersSubscription(x.portfolio, x.instrument.exchange),
        (instrument, orders) => ({instrument, orders})
      ),
      map(s => s.orders.allOrders.filter(o => o.symbol === s.instrument.instrument.symbol && o.type === 'limit' && o.status === 'working')),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.initCurrentAskBid();
  }

  setLimitOrderValue(formData: OrderFormValue<LimitOrderFormValue>) {
    this.setInitialValues(formData.value?.price, formData.value?.quantity);
    this.limitOrderFormValue = formData.isValid ? formData.value : null;
    this.updateCanSubmitOrder();
  }

  setMarketOrderValue(formData: OrderFormValue<MarketOrderFormValue>) {
    this.setInitialValues(undefined, formData.value?.quantity);
    this.marketOrderFormValue = formData.isValid ? formData.value : null;
    this.updateCanSubmitOrder();
  }

  setStopOrderValue(formData: OrderFormValue<StopOrderFormValue>) {
    this.setInitialValues(formData.value?.price, formData.value?.quantity);
    this.stopOrderFormValue = formData.isValid ? formData.value : null;
    this.updateCanSubmitOrder();
  }

  submitOrder(side: Side) {
    this.currentInstrumentWithPortfolio$.pipe(
      take(1)
    ).subscribe(({instrument, portfolio}) => {
      let order$: Observable<SubmitOrderResult> | null = null;
      switch (this.lastSelectedTab) {
        case ComponentTabs.LimitOrder:
          order$ = this.prepareLimitOrder(instrument, portfolio, side);
          break;
        case ComponentTabs.MarketOrder:
          order$ = this.prepareMarketOrder(instrument, portfolio, side);
          break;
        case ComponentTabs.StopOrder:
          order$ = this.prepareStopOrder(instrument, portfolio, side);
          break;
      }

      if (!order$) {
        return;
      }

      this.canSubmitOrder$.next(false);
      if (side === Side.Buy) {
        this.buyButtonLoading$.next(true);
      } else {
        this.sellButtonLoading$.next(true);
      }

      order$.pipe(
        finalize(() => {
          this.buyButtonLoading$.next(false);
          this.sellButtonLoading$.next(false);
          this.updateCanSubmitOrder();
        }),
        take(1)
      ).subscribe();
    });
  }

  setInitialValues(price?: number, quantity?: number, target?: OrderType, withLimit?: boolean) {
    this.initialValues$.next(
      Object.assign(
        JSON.parse(JSON.stringify(this.initialValues$.getValue() || {})),
        JSON.parse(JSON.stringify({
          price,
          quantity,
          target,
          withLimit
        }))
      ));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.canSubmitOrder$.complete();
    this.buyButtonLoading$.complete();
    this.sellButtonLoading$.complete();
    this.initialValues$.complete();
  }

  hasOrdersWithSide(orders: Order[], side: Side): boolean {
    return !!orders.find(o => o.side === side);
  }

  isOrderTab(tab: ComponentTabs): boolean {
    return [ComponentTabs.LimitOrder, ComponentTabs.MarketOrder, ComponentTabs.StopOrder].includes(tab);
  }

  updateLimitOrdersPrice(step: number, side: Side) {
    this.activeLimitOrders$.pipe(
      withLatestFrom(this.currentInstrumentWithPortfolio$),
      take(1)
    ).subscribe(([orders, instrument]) => {
      const ordersToUpdate = orders.filter(o => o.side === side);
      if (ordersToUpdate.length === 0) {
        return;
      }

      ordersToUpdate.forEach(order => {
        const precision = MathHelper.getPrecision(instrument.instrument.minstep);

        const newPrice = MathHelper.round(order.price + step * instrument.instrument.minstep, precision);
        this.orderService.submitLimitOrderEdit(
          {
            id: order.id,
            quantity: order.qtyBatch - (order.filledQtyBatch ?? 0),
            price: newPrice,
            instrument: {
              symbol: order.symbol,
              exchange: order.exchange
            },
          },
          instrument.portfolio
        ).subscribe();
      });
    });
  }

  private isEqualOrderSubmitSettings(
    settings1?: OrderSubmitSettings,
    settings2?: OrderSubmitSettings
  ) {
    if (settings1 && settings2) {
      return (
        settings1.linkToActive == settings2.linkToActive &&
        settings1.guid == settings2.guid &&
        settings1.symbol == settings2.symbol &&
        settings1.exchange == settings2.exchange &&
        settings1.enableLimitOrdersFastEditing == settings2.enableLimitOrdersFastEditing &&
        isArrayEqual(settings1.limitOrderPriceMoveSteps, settings2.limitOrderPriceMoveSteps, (a, b) => a === b) &&
        settings1.showVolumePanel == settings2.showVolumePanel &&
        isArrayEqual(settings1.workingVolumes, settings2.workingVolumes, (a, b) => a === b)
      );
    } else return false;
  }

  private updateCanSubmitOrder() {
    let isValueSet = false;
    switch (this.lastSelectedTab) {
      case ComponentTabs.LimitOrder:
        isValueSet = this.limitOrderFormValue != null;
        break;
      case ComponentTabs.MarketOrder:
        isValueSet = this.marketOrderFormValue != null;
        break;
      case ComponentTabs.StopOrder:
        isValueSet = this.stopOrderFormValue != null;
        break;
    }

    setTimeout(() => this.canSubmitOrder$.next(isValueSet), 0);
  }

  private prepareLimitOrder(instrument: InstrumentKey, portfolio: string, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.limitOrderFormValue) {
      return null;
    }

    if (this.limitOrderFormValue.topOrderPrice || this.limitOrderFormValue.bottomOrderPrice) {
      const orders: ((LimitOrder | StopLimitOrder | StopMarketOrder) & { type: 'Limit' | 'StopLimit' | 'Stop' })[] = [{
        ...this.limitOrderFormValue,
        type: 'Limit',
        side,
        instrument
      }];

      if (this.limitOrderFormValue.topOrderPrice) {
        orders.push({
          ...this.limitOrderFormValue,
          condition: LessMore.More,
          triggerPrice: this.limitOrderFormValue.topOrderPrice!,
          side: this.limitOrderFormValue.topOrderSide!,
          type: 'StopLimit',
          instrument,
          activate: false
        });
      }

      if (this.limitOrderFormValue.bottomOrderPrice) {
        orders.push({
          ...this.limitOrderFormValue,
          condition: LessMore.Less,
          triggerPrice: this.limitOrderFormValue.bottomOrderPrice!,
          side: this.limitOrderFormValue.bottomOrderSide!,
          type: 'StopLimit',
          instrument,
          activate: false
        });
      }

      return this.orderService.submitOrdersGroup(orders, portfolio, ExecutionPolicy.TriggerBracketOrders);
    }

    return this.orderService.submitLimitOrder(
      {
        ...this.limitOrderFormValue,
        instrument: {
          ...instrument,
          instrumentGroup: this.limitOrderFormValue.instrumentGroup ?? instrument.instrumentGroup
        },
        side: side
      },
      portfolio
    );
  }

  private prepareMarketOrder(instrument: InstrumentKey, portfolio: string, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.marketOrderFormValue) {
      return null;
    }

    return this.orderService.submitMarketOrder(
      {
        ...this.marketOrderFormValue,
        instrument: {
          ...instrument,
          instrumentGroup: this.marketOrderFormValue.instrumentGroup ?? instrument.instrumentGroup
        },
        side: side
      },
      portfolio
    );
  }

  private prepareStopOrder(instrument: InstrumentKey, portfolio: string, side: Side): Observable<SubmitOrderResult> | null {
    if (!this.stopOrderFormValue) {
      return null;
    }

    if (this.stopOrderFormValue.allowLinkedOrder) {
      const orders: (StopLimitOrder & { type: 'StopLimit' | 'Stop' })[] = [
        {
          ...this.stopOrderFormValue,
          type: this.stopOrderFormValue.withLimit ? 'StopLimit' : 'Stop',
          side,
          instrument: {...instrument}
        },
        {
          ...this.stopOrderFormValue.linkedOrder! as StopLimitOrder,
          type: this.stopOrderFormValue.linkedOrder.withLimit ? 'StopLimit' : 'Stop',
          instrument: {...instrument},
          side: this.stopOrderFormValue.linkedOrder.side!
        }
      ];

      return this.orderService.submitOrdersGroup(orders, portfolio, ExecutionPolicy.OnExecuteOrCancel);
    }

    if (this.stopOrderFormValue.withLimit) {
      return this.orderService.submitStopLimitOrder(
        {
          ...this.stopOrderFormValue,
          instrument: {...instrument},
          side: side
        },
        portfolio
      );
    }

    return this.orderService.submitStopMarketOrder(
      {
        ...this.stopOrderFormValue,
        instrument: {...instrument},
        side: side
      },
      portfolio
    );
  }

  private getFormIndexByType(tab: ComponentTabs) {
    return [ComponentTabs.LimitOrder, ComponentTabs.MarketOrder, ComponentTabs.StopOrder, ComponentTabs.Notifications].indexOf(tab);
  }

  private initCurrentAskBid() {
    this.currentAskBid$ = this.settings$.pipe(
      switchMap(settings => this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
        OrderBookDataFeedHelper.getRealtimeDateRequest(
          settings.symbol,
          settings.exchange,
          settings.instrumentGroup,
          1
        ),
        OrderBookDataFeedHelper.getOrderbookSubscriptionId
      )),
      filter(x => !!x),
      map(orderbook => {
          const bestAsk = orderbook.a[0];
          const bestBid = orderbook.b[0];

          return {
            ask: !!bestAsk
              ? {
                price: bestAsk.p,
                volume: bestAsk.v
              }
              : null,
            bid: !!bestBid
              ? {
                price: bestBid.p,
                volume: bestBid.v
              }
              : null
          };
        }
      ),
      startWith(null),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
