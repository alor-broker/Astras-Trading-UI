import {
  Injectable,
} from '@angular/core';
import { ScalperOrderBookDataContext } from '../models/scalper-order-book-data-context.model';
import { Side } from '../../../shared/models/enums/side.model';
import {
  BodyRow,
  CurrentOrderDisplay
} from '../models/scalper-order-book.model';
import {
  combineLatest,
  filter,
  iif,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import {
  map,
  switchMap
} from 'rxjs/operators';
import {
  PriceUnits,
  ScalperOrderBookWidgetSettings
} from '../models/scalper-order-book-settings.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes,
  ScalperOrderBookMouseAction,
  ScalperOrderBookMouseActionsMap
} from '../../../shared/models/terminal-settings/terminal-settings.model';
import { TerminalSettingsHelper } from '../../../shared/utils/terminal-settings-helper';
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { OrderType } from "../../../shared/models/orders/order.model";
import { CancelOrdersCommand } from "../commands/cancel-orders-command";
import { ClosePositionByMarketCommand } from "../commands/close-position-by-market-command";
import { SubmitMarketOrderCommand } from "../commands/submit-market-order-command";
import { ReversePositionByMarketCommand } from "../commands/reverse-position-by-market-command";
import {
  StopLimitOrderTracker,
  SubmitStopLimitOrderCommand
} from "../commands/submit-stop-limit-order-command";
import {
  SetStopLossCommand,
  StopMarketOrderTracker
} from "../commands/set-stop-loss-command";
import {
  BracketOptions,
  LimitOrderTracker,
  SubmitLimitOrderCommand
} from "../commands/submit-limit-order-command";
import { SubmitBestPriceOrderCommand } from "../commands/submit-best-price-order-command";
import { GetBestOfferCommand } from "../commands/get-best-offer-command";
import { UpdateOrdersCommand } from "../commands/update-orders-command";
import { ScalperCommand } from "../models/scalper-command";
import { ScalperHotKeyCommandService } from "./scalper-hot-key-command.service";

@Injectable()
export class ScalperCommandProcessorService {
  private mouseActionsMap$: Observable<ScalperOrderBookMouseActionsMap> | null = null;

  constructor(
    private readonly hotkeysService: ScalperHotKeyCommandService,
    private readonly terminalSettingsService: TerminalSettingsService,
    // commands
    private readonly cancelOrdersCommand: CancelOrdersCommand,
    private readonly closePositionByMarketCommand: ClosePositionByMarketCommand,
    private readonly submitMarketOrderCommand: SubmitMarketOrderCommand,
    private readonly reversePositionByMarketCommand: ReversePositionByMarketCommand,
    private readonly submitStopLimitOrderCommand: SubmitStopLimitOrderCommand,
    private readonly setStopLossCommand: SetStopLossCommand,
    private readonly submitLimitOrderCommand: SubmitLimitOrderCommand,
    private readonly submitBestPriceOrderCommand: SubmitBestPriceOrderCommand,
    private readonly getBestOfferCommand: GetBestOfferCommand,
    private readonly updateOrdersCommand: UpdateOrdersCommand
  ) {
  }

  processLeftMouseClick(e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.processClick('left', e, row, dataContext);
  }

  processRightMouseClick(e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.processClick('right', e, row, dataContext);
  }

  processHotkeyPress(command: ScalperCommand, isActive: boolean, dataContext: ScalperOrderBookDataContext): void {
    if (this.handleAllCommands(command, dataContext)) {
      return;
    }

    if (!isActive) {
      return;
    }

    this.handleCurrentOrderBookCommands(command, dataContext);
  }

  updateOrdersPrice(orders: CurrentOrderDisplay[], row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.updateOrdersCommand.execute({
          ordersToUpdate: orders,
          updates: { price: row.price },
          silent: settings.widgetSettings.enableMouseClickSilentOrders
        });
      }
    );
  }

  getPossibleActions(): Observable<ScalperOrderBookMouseAction[]> {
    return combineLatest([
      this.getMouseActionsMap(),
      this.hotkeysService.modifiers$
    ]).pipe(
      map(([availableActions, modifiers]) => {
        if (modifiers.shiftKey && !modifiers.altKey && !modifiers.ctrlKey) {
          return availableActions.actions
            .filter(x => x.modifier === 'shift')
            .map(x => x.action);
        }

        if (modifiers.ctrlKey && !modifiers.altKey && !modifiers.shiftKey) {
          return availableActions.actions
            .filter(x => x.modifier === 'ctrl')
            .map(x => x.action);
        }

        return [];
      })
    );
  }

  private handleAllCommands(command: ScalperCommand, dataContext: ScalperOrderBookDataContext): boolean {
    const commandType = command.type;
    if (commandType === AllOrderBooksHotKeysTypes.cancelOrdersAll) {
      this.cancelAllOrders(dataContext);
      return true;
    }

    if (commandType === AllOrderBooksHotKeysTypes.cancelOrdersAndClosePositionsByMarketAll) {
      this.cancelAllOrders(dataContext);
      this.closePositionsByMarket(dataContext);
      return true;
    }

    if (commandType === AllOrderBooksHotKeysTypes.cancelOrdersKey) {
      this.cancelLimitOrders(dataContext);
      return true;
    }

    if (commandType === AllOrderBooksHotKeysTypes.closePositionsKey) {
      this.closePositionsByMarket(dataContext);
      return true;
    }

    return false;
  }

  private handleCurrentOrderBookCommands(command: ScalperCommand, dataContext: ScalperOrderBookDataContext): void {
    const commandType = command.type;

    if (commandType === ActiveOrderBookHotKeysTypes.cancelOrderbookOrders) {
      this.cancelLimitOrders(dataContext);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.cancelStopOrdersCurrent) {
      this.cancelStopOrders(dataContext);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.closeOrderbookPositions) {
      this.closePositionsByMarket(dataContext);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.sellBestOrder) {
      this.placeBestOrder(dataContext, Side.Sell);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.buyBestOrder) {
      this.placeBestOrder(dataContext, Side.Buy);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.sellBestBid) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithCurrentOrderBook(
            dataContext,
            orderBook => {
              this.callWithSelectedVolume(
                dataContext,
                workingVolume => {
                  this.callWithPortfolioKey(
                    dataContext,
                    portfolioKey => {
                      this.callWithPosition(
                        dataContext,
                        position => this.getBestOfferCommand.execute({
                          side: Side.Sell,
                          instrumentKey: settings.widgetSettings,
                          quantity: workingVolume,
                          orderBook,
                          targetPortfolio: portfolioKey.portfolio,
                          bracketOptions: this.getBracketOptions(settings.widgetSettings, position),
                          priceStep: settings.instrument.minstep,
                          orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey.portfolio)
                        })
                      );
                    }
                  );
                });
            });
        });

      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.buyBestAsk) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithCurrentOrderBook(
            dataContext,
            orderBook => {
              this.callWithSelectedVolume(
                dataContext,
                workingVolume => {
                  this.callWithPortfolioKey(
                    dataContext,
                    portfolioKey => {
                      this.callWithPosition(
                        dataContext,
                        position => this.getBestOfferCommand.execute({
                          side: Side.Buy,
                          instrumentKey: settings.widgetSettings,
                          quantity: workingVolume,
                          orderBook,
                          targetPortfolio: portfolioKey.portfolio,
                          bracketOptions: this.getBracketOptions(settings.widgetSettings, position),
                          priceStep: settings.instrument.minstep,
                          orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey.portfolio)
                        })
                      );
                    }
                  );
                });
            });
        });

      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.sellMarket) {
      this.placeMarketOrderSilent(dataContext, Side.Sell);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.buyMarket) {
      this.placeMarketOrderSilent(dataContext, Side.Buy);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.reverseOrderbookPositions) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithPosition(
            dataContext,
            position => {
              this.reversePositionByMarketCommand.execute({
                currentPosition: position,
                targetInstrumentBoard: settings.widgetSettings.instrumentGroup ?? null
              });
            }
          );
        }
      );

      return;
    }
  }

  private cancelLimitOrders(dataContext: ScalperOrderBookDataContext): void {
    this.cancelOrdersOfType([OrderType.Limit], dataContext);
  }

  private cancelStopOrders(dataContext: ScalperOrderBookDataContext): void {
    this.cancelOrdersOfType([OrderType.StopMarket, OrderType.StopLimit], dataContext);
  }

  private cancelAllOrders(dataContext: ScalperOrderBookDataContext): void {
    this.cancelOrdersOfType([OrderType.Limit, OrderType.StopMarket, OrderType.StopLimit], dataContext);
  }

  private cancelOrdersOfType(types: OrderType[], dataContext: ScalperOrderBookDataContext): void {
    this.callWithCurrentOrders(
      dataContext,
      orders => {
        const filteredOrders = orders.filter(x => types.includes(x.type));

        if (filteredOrders.length > 0) {
          this.cancelOrdersCommand.execute({
            ordersToCancel: filteredOrders.map(x => ({
              orderId: x.orderId,
              exchange: x.exchange,
              portfolio: x.portfolio,
              orderType: x.type
            }))
          });
        }
      });
  }

  private closePositionsByMarket(dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithPosition(
          dataContext,
          position => this.closePositionByMarketCommand.execute({
            currentPosition: position,
            targetInstrumentBoard: settings.widgetSettings.instrumentGroup ?? null
          })
        );
      }
    );
  }

  private placeBestOrder(dataContext: ScalperOrderBookDataContext, side: Side): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithCurrentOrderBook(
          dataContext,
          orderBook => {
            this.callWithSelectedVolume(
              dataContext,
              workingVolume => {
                this.callWithPortfolioKey(
                  dataContext,
                  portfolioKey => {
                    this.callWithPosition(
                      dataContext,
                      position => this.submitBestPriceOrderCommand.execute({
                        instrumentKey: settings.widgetSettings,
                        quantity: workingVolume,
                        side,
                        targetPortfolio: portfolioKey.portfolio,
                        orderBook,
                        priceStep: settings.instrument.minstep,
                        bracketOptions: this.getBracketOptions(settings.widgetSettings, position),
                        orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey.portfolio)
                      })
                    );
                  }
                );
              });
          });
      });
  }

  private callWithCurrentOrders(
    dataContext: ScalperOrderBookDataContext,
    action: (orders: CurrentOrderDisplay[]) => void): void {
    dataContext.currentOrders$.pipe(
      take(1)
    ).subscribe(action);
  }

  private placeMarketOrderSilent(dataContext: ScalperOrderBookDataContext, side: Side): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithSelectedVolume(
          dataContext,
          workingVolume => {
            this.callWithPortfolioKey(
              dataContext,
              portfolioKey => this.submitMarketOrderCommand.execute({
                instrumentKey: settings.widgetSettings,
                side,
                quantity: workingVolume,
                targetPortfolio: portfolioKey.portfolio,
                silent: true
              })
            );
          });
      });
  }

  private callWithSettings(
    dataContext: ScalperOrderBookDataContext,
    action: (settings: { widgetSettings: ScalperOrderBookWidgetSettings, instrument: Instrument }) => void): void {
    dataContext.extendedSettings$.pipe(
      take(1)
    ).subscribe(s => action(s));
  }

  private callWithPortfolioKey(
    dataContext: ScalperOrderBookDataContext,
    action: (portfolioKey: PortfolioKey) => void): void {
    dataContext.currentPortfolio$.pipe(
      take(1)
    ).subscribe(p => action(p));
  }

  private callWithPosition(
    dataContext: ScalperOrderBookDataContext,
    action: (position: Position | null) => void): void {
    dataContext.position$.pipe(
      take(1)
    ).subscribe(p => action(p));
  }

  private callWithCurrentOrderBook(
    dataContext: ScalperOrderBookDataContext,
    action: (orderBook: OrderbookData) => void): void {
    dataContext.orderBook$.pipe(
      take(1),
      map(ob => ob.rows)
    ).subscribe(action);
  }

  private callWithSelectedVolume(
    dataContext: ScalperOrderBookDataContext,
    action: (workingVolume: number) => void): void {
    this.hotkeysService.modifiers$
      .pipe(
        switchMap(
          modifiers => iif(
            () => modifiers.altKey,
            dataContext.position$.pipe(map(p => p?.qtyTFutureBatch)),
            dataContext.workingVolume$
          )
        ),
        take(1),
        filter(workingVolume => workingVolume != null && !!workingVolume),
        map(x => Math.abs(x!))
      )
      .subscribe(workingVolume => action(workingVolume!));
  }

  private getMouseActionsMap(): Observable<ScalperOrderBookMouseActionsMap> {
    if (!this.mouseActionsMap$) {
      this.mouseActionsMap$ = this.terminalSettingsService.getSettings().pipe(
        map(x => x.scalperOrderBookMouseActions ?? TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1()),
        shareReplay(1)
      );
    }

    return this.mouseActionsMap$;
  }

  private processClick(btn: 'left' | 'right', e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.getMouseActionsMap().pipe(
      take(1),
      map(map => {
        return map.actions.find(a =>
            a.button === btn
            && (a.orderBookRowType === row.rowType || a.orderBookRowType === 'any')
            && (
              (!a.modifier && !e.ctrlKey && !e.shiftKey && !e.metaKey)
              || (a.modifier === 'ctrl' && (e.ctrlKey || e.metaKey))
              || (a.modifier === 'shift' && e.shiftKey)
            )
        )?.action ?? null;
      })
    ).subscribe(action => {
      if (action == null) {
        return;
      }

      this.getActionMethod(action)(row, dataContext);
    });
  }

  private getActionMethod(action: ScalperOrderBookMouseAction): (row: { price: number }, dataContext: ScalperOrderBookDataContext) => void {
    switch (action) {
      case ScalperOrderBookMouseAction.StopLimitBuyOrder:
        return (row, dataContext) => this.stopLimitAction(row, Side.Buy, dataContext);
      case ScalperOrderBookMouseAction.StopLimitSellOrder:
        return (row, dataContext) => this.stopLimitAction(row, Side.Sell, dataContext);
      case ScalperOrderBookMouseAction.StopLossOrder:
        return (row, dataContext) => this.stopLossAction(row, dataContext);
      case ScalperOrderBookMouseAction.LimitBuyOrder:
        return (row, dataContext) => this.limitOrderAction(row, Side.Buy, dataContext);
      case ScalperOrderBookMouseAction.LimitSellOrder:
        return (row, dataContext) => this.limitOrderAction(row, Side.Sell, dataContext);
      case ScalperOrderBookMouseAction.MarketBuyOrder:
        return (row, dataContext) => this.marketOrderAction(Side.Buy, dataContext);
      case ScalperOrderBookMouseAction.MarketSellOrder:
        return (row, dataContext) => this.marketOrderAction(Side.Sell, dataContext);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  private stopLimitAction(row: { price: number }, side: Side, dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithSelectedVolume(
          dataContext,
          workingVolume => {
            this.callWithPortfolioKey(
              dataContext,
              portfolioKey => {
                this.submitStopLimitOrderCommand.execute({
                  instrumentKey: settings.instrument,
                  side,
                  quantity: workingVolume,
                  triggerPrice: row.price,
                  priceOptions: {
                    distance: settings.widgetSettings.stopLimitOrdersDistance ?? 0,
                    priceStep: settings.instrument.minstep
                  },
                  targetPortfolio: portfolioKey.portfolio,
                  silent: settings.widgetSettings.enableMouseClickSilentOrders,
                  orderTracker: this.getStopLimitOrderTracker(dataContext, portfolioKey.portfolio)
                });
              }
            );
          });
      });
  }

  private getLimitOrderTracker(dataContext: ScalperOrderBookDataContext, portfolio: string): LimitOrderTracker {
    return {
      beforeOrderCreated: (order): void => {
        if(order.meta?.trackId != null) {
          dataContext.addLocalOrder({
            orderId: order.meta!.trackId!,
            type: OrderType.Limit,
            side: order.side,
            displayVolume: order.quantity,
            price: order.price,
            symbol: order.instrument.symbol,
            exchange: order.instrument.exchange,
            instrumentGroup: order.instrument.instrumentGroup,
            portfolio,
            isDirty: true
          });
        }
      },
      orderProcessed: localId => dataContext.removeLocalOrder(localId)
    };
  }

  private getStopLimitOrderTracker(dataContext: ScalperOrderBookDataContext, portfolio: string): StopLimitOrderTracker {
    return {
      beforeOrderCreated: (order): void => {
        if(order.meta?.trackId != null) {
          dataContext.addLocalOrder({
            orderId: order.meta!.trackId!,
            type: OrderType.StopLimit,
            side: order.side,
            displayVolume: order.quantity,
            price: order.price,
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            symbol: order.instrument.symbol,
            exchange: order.instrument.exchange,
            instrumentGroup: order.instrument.instrumentGroup,
            portfolio,
            isDirty: true
          });
        }
      },
      orderProcessed: localId => dataContext.removeLocalOrder(localId)
    };
  }

  private getStopMarketOrderTracker(dataContext: ScalperOrderBookDataContext, portfolio?: string): StopMarketOrderTracker {
    return {
      beforeOrderCreated: (order): void => {
        if(order.meta?.trackId != null && portfolio != null) {
          dataContext.addLocalOrder({
            orderId: order.meta!.trackId!,
            type: OrderType.StopMarket,
            side: order.side,
            displayVolume: order.quantity,
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            symbol: order.instrument.symbol,
            exchange: order.instrument.exchange,
            instrumentGroup: order.instrument.instrumentGroup,
            portfolio,
            isDirty: true
          });
        }
      },
      orderProcessed: localId => dataContext.removeLocalOrder(localId)
    };
  }

  private stopLossAction(row: { price: number }, dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithPosition(
          dataContext,
          position => {
            this.setStopLossCommand.execute({
              currentPosition: position,
              triggerPrice: row.price,
              targetInstrumentBoard: settings.widgetSettings.instrumentGroup ?? null,
              silent: settings.widgetSettings.enableMouseClickSilentOrders,
              orderTracker: this.getStopMarketOrderTracker(dataContext, position?.portfolio)
            });
          }
        );
      }
    );
  }

  private limitOrderAction(row: { price: number }, side: Side, dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithSelectedVolume(
          dataContext,
          workingVolume => {
            this.callWithPortfolioKey(
              dataContext,
              portfolioKey => {
                this.callWithPosition(
                  dataContext,
                  position => {
                    const widgetSettings = settings.widgetSettings;

                    this.submitLimitOrderCommand.execute({
                      instrumentKey: widgetSettings,
                      side,
                      price: row.price,
                      quantity: workingVolume,
                      targetPortfolio: portfolioKey.portfolio,
                      bracketOptions: this.getBracketOptions(
                        widgetSettings,
                        position
                      ),
                      priceStep: settings.instrument.minstep,
                      silent: settings.widgetSettings.enableMouseClickSilentOrders,
                      orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey.portfolio)
                    });
                  }
                );
              }
            );
          });
      });
  }

  private getBracketOptions(
    settings: ScalperOrderBookWidgetSettings,
    currentPosition: Position | null
  ): BracketOptions {
    return {
      profitPriceRatio: settings.bracketsSettings?.topOrderPriceRatio ?? null,
      lossPriceRatio: settings.bracketsSettings?.bottomOrderPriceRatio ?? null,
      orderPriceUnits: settings.bracketsSettings?.orderPriceUnits ?? PriceUnits.Points,
      applyBracketOnClosing: settings.bracketsSettings?.useBracketsWhenClosingPosition ?? false,
      currentPosition
    };
  }

  private marketOrderAction(side: Side, dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithSelectedVolume(
          dataContext,
          workingVolume => {
            this.callWithPortfolioKey(
              dataContext,
              portfolioKey => {
                this.submitMarketOrderCommand.execute({
                  instrumentKey: settings.widgetSettings,
                  side,
                  quantity: workingVolume,
                  targetPortfolio: portfolioKey.portfolio,
                  silent: settings.widgetSettings.enableMouseClickSilentOrders
                });
              }
            );
          });
      });
  }
}
