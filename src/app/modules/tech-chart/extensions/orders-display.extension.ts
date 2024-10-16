import {
  BaseExtension,
  ChartContext
} from "./base.extension";
import {
  IChartWidgetApi,
  IOrderLineAdapter
} from "../../../../assets/charting_library";
import {
  Observable,
  Subscription,
  switchMap,
  TeardownLogic
} from "rxjs";
import { Injectable } from "@angular/core";
import {
  Order,
  OrderType,
  StopOrder
} from "../../../shared/models/orders/order.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import {
  debounceTime,
  map,
  startWith
} from "rxjs/operators";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import {
  TranslatorFn,
  TranslatorService
} from "../../../shared/services/translator.service";
import { ThemeColors } from "../../../shared/models/settings/theme-settings.model";
import { LineMarkerPosition } from "../models/tech-chart-settings.model";
import { Side } from "../../../shared/models/enums/side.model";
import {
  EditOrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import {
  getConditionSign,
  getConditionTypeByString
} from "../../../shared/utils/order-conditions-helper";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

class OrdersState {
  readonly limitOrders = new Map<string, IOrderLineAdapter>();
  readonly stopOrders = new Map<string, IOrderLineAdapter>();
  private readonly tearDown = new Subscription();

  constructor() {
    this.tearDown.add(() => this.clear());
  }

  destroy(): void {
    this.tearDown.unsubscribe();
  }

  clear(): void {
    this.clearOrders(this.limitOrders);
    this.clearOrders(this.stopOrders);
  }

  onDestroy(teardown: TeardownLogic): void {
    this.tearDown.add(teardown);
  }

  private clearOrders(orders: Map<string, IOrderLineAdapter>): void {
    orders.forEach(value => {
      try {
        value.remove();
      } catch {
      }
    });

    orders.clear();
  }
}

@Injectable()
export class OrdersDisplayExtension extends BaseExtension {
  private ordersState: OrdersState | null = null;
  private drawOrdersSub: Subscription | null = null;

  constructor(
    private readonly currentDashboardService: DashboardContextService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly orderCommandService: OrderCommandService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly translatorService: TranslatorService
  ) {
    super();
  }

  apply(context: ChartContext): void {
    if (!(context.settings.showPosition ?? true)) {
      return;
    }

    this.drawOrdersSub?.unsubscribe();

    this.drawOrdersSub = this.translatorService.getTranslator('tech-chart/tech-chart')
      .subscribe(translator => {
        this.ordersState?.destroy();
        this.ordersState = new OrdersState();

        this.ordersState.onDestroy(this.drawOrders(context, translator));
      });
  }

  update(context: ChartContext): void {
    this.apply(context);
  }

  destroyState(): void {
    this.drawOrdersSub?.unsubscribe();
    this.ordersState?.destroy();
  }

  private drawOrders(context: ChartContext, translator: TranslatorFn): TeardownLogic {
    const tearDown = new Subscription();

    const chartApi = this.getChartApi(context);
    tearDown.add(this.setupOrdersUpdate(
      chartApi,
      this.getLimitOrdersStream(context.settings as InstrumentKey),
      this.ordersState!.limitOrders,
      (order, orderLineAdapter) => {
        this.fillOrderBaseParameters(
          order, orderLineAdapter,
          context.theme.themeColors,
          context.settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right
        );
        this.fillLimitOrder(
          order,
          orderLineAdapter,
          translator);
      }
    ));

    tearDown.add(this.setupOrdersUpdate(
      chartApi,
      this.getStopOrdersStream(context.settings as InstrumentKey),
      this.ordersState!.stopOrders,
      (order, orderLineAdapter) => {
        this.fillOrderBaseParameters(
          order,
          orderLineAdapter,
          context.theme.themeColors,
          context.settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right
        );
        this.fillStopOrder(
          order,
          orderLineAdapter,
          translator
        );
      }
    ));

    return tearDown;
  }

  private setupOrdersUpdate<T extends Order>(
    chartApi: IChartWidgetApi,
    data$: Observable<T[]>,
    state: Map<string, IOrderLineAdapter>,
    fillOrderLine: (order: T, orderLineAdapter: IOrderLineAdapter) => void): TeardownLogic {
    const removeItem = (itemKey: string): void => {
      try {
        state.get(itemKey)?.remove();
      } catch {
      }

      state.delete(itemKey);
    };

    return data$.subscribe(
      orders => {
        Array.from(state.keys()).forEach(orderId => {
          if (!orders.find(o => o.id === orderId)) {
            removeItem(orderId);
          }
        });

        orders.forEach(order => {
          const existingOrderLine = state.get(order.id);
          if (order.status !== 'working') {
            if (existingOrderLine) {
              removeItem(order.id);
            }

            return;
          }

          if (!existingOrderLine) {
            const orderLine = chartApi.createOrderLine();
            fillOrderLine(order, orderLine);
            state.set(order.id, orderLine);
          }
        });
      }
    );
  }

  private getLimitOrdersStream(instrumentKey: InstrumentKey): Observable<Order[]> {
    return this.currentDashboardService.selectedPortfolio$.pipe(
      switchMap(portfolio => this.portfolioSubscriptionsService.getOrdersSubscription(portfolio.portfolio, portfolio.exchange)),
      map(orders => orders.allOrders.filter(o => o.type === OrderType.Limit)),
      debounceTime(100),
      map(orders => orders.filter(o => o.symbol === instrumentKey.symbol && o.exchange === instrumentKey.exchange)),
      startWith([])
    );
  }

  private getStopOrdersStream(instrumentKey: InstrumentKey): Observable<StopOrder[]> {
    return this.currentDashboardService.selectedPortfolio$.pipe(
      switchMap(portfolio => this.portfolioSubscriptionsService.getStopOrdersSubscription(portfolio.portfolio, portfolio.exchange)),
      map(orders => orders.allOrders),
      debounceTime(100),
      map(orders => orders.filter(o => o.symbol === instrumentKey.symbol && o.exchange === instrumentKey.exchange)),
      startWith([])
    );
  }

  private fillOrderBaseParameters(order: Order, orderLineAdapter: IOrderLineAdapter, themeColors: ThemeColors, position: LineMarkerPosition): void {
    orderLineAdapter
      .setQuantity((order.qtyBatch - (order.filledQtyBatch ?? 0)).toString())
      .setQuantityBackgroundColor(themeColors.componentBackground)
      .setQuantityTextColor(themeColors.chartPrimaryTextColor)
      .setQuantityBorderColor(themeColors.primaryColor)
      .setBodyBorderColor(themeColors.primaryColor)
      .setBodyBackgroundColor(themeColors.componentBackground)
      .setLineStyle(2)
      .setLineColor(themeColors.primaryColor)
      .setCancelButtonBackgroundColor(themeColors.componentBackground)
      .setCancelButtonBorderColor('transparent')
      .setCancelButtonIconColor(themeColors.primaryColor)
      .setBodyTextColor(order.side === Side.Buy ? themeColors.buyColor : themeColors.sellColor)
      .setLineLength(this.getMarkerLineLengthPercent(position), "percentage")
    ;
  }

  private fillLimitOrder(
    order: Order,
    orderLineAdapter: IOrderLineAdapter,
    translator: TranslatorFn
  ): void {
    const getEditCommand = (): EditOrderDialogParams => ({
      orderId: order.id,
      orderType: OrderFormType.Limit,
      instrumentKey: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      portfolioKey: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      initialValues: {}
    } as EditOrderDialogParams);

    orderLineAdapter.setText('L')
      .setTooltip(`${translator([order.side === Side.Buy ? 'buy' : 'sell'])} ${translator(['limit'])}`)
      .setPrice(order.price)
      .onCancel(() => this.orderCommandService.cancelOrders([{
          orderId: order.id,
          portfolio: order.portfolio,
          exchange: order.exchange,
          orderType: order.type
        }]).subscribe()
      )
      .onModify(() => this.ordersDialogService.openEditOrderDialog(getEditCommand()))
      .onMove(() => {
          const params = {
            ...getEditCommand(),
            cancelCallback: (): IOrderLineAdapter => orderLineAdapter.setPrice(order.price)
          };

          params.initialValues = {
            ...params.initialValues,
            price: orderLineAdapter.getPrice(),
            hasPriceChanged: orderLineAdapter.getPrice() !== order.price
          };
          this.ordersDialogService.openEditOrderDialog(params);
        }
      );
  }

  private fillStopOrder(
    order: StopOrder,
    orderLineAdapter: IOrderLineAdapter,
    translator: TranslatorFn
  ): void {
    const conditionType: LessMore = getConditionTypeByString(order.conditionType)!;
    const orderText = 'S'
      + (order.type === OrderType.StopLimit ? 'L' : 'M')
      + ' '
      + (getConditionSign(conditionType) as string);

    const orderTooltip = translator([order.side === Side.Buy ? 'buy' : 'sell'])
      + ' '
      + translator([order.type === OrderType.StopLimit ? 'stopLimit' : 'stopMarket'])
      + ' ('
      + translator([(conditionType as LessMore | null) ?? ''])
      + ')';

    const getEditCommand = (): EditOrderDialogParams => ({
      orderId: order.id,
      orderType: OrderFormType.Stop,
      instrumentKey: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      portfolioKey: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      initialValues: {}
    } as EditOrderDialogParams);

    orderLineAdapter
      .setText(orderText)
      .setTooltip(orderTooltip)
      .setPrice(order.triggerPrice)
      .onCancel(() => this.orderCommandService.cancelOrders([{
          orderId: order.id,
          portfolio: order.portfolio,
          exchange: order.exchange,
          orderType: order.type
        }]).subscribe()
      )
      .onModify(() => this.ordersDialogService.openEditOrderDialog(getEditCommand()))
      .onMove(() => {
          const params = {
            ...getEditCommand(),
            cancelCallback: (): IOrderLineAdapter => orderLineAdapter.setPrice(order.triggerPrice)
          };

          params.initialValues = {
            ...params.initialValues,
            price: orderLineAdapter.getPrice(),
            hasPriceChanged: orderLineAdapter.getPrice() !== order.price
          };
          this.ordersDialogService.openEditOrderDialog(params);
        }
      );
  }

  private getMarkerLineLengthPercent(position: LineMarkerPosition | undefined): number {
    switch (position) {
      case LineMarkerPosition.Left:
        return 90;
      case LineMarkerPosition.Middle:
        return 40;
      default:
        return 10;
    }
  }
}
