import {
  inject,
  Injectable
} from '@angular/core';
import {
  combineLatest,
  filter,
  iif,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {
  map,
  switchMap
} from 'rxjs/operators';
import {ScalperHotKeyCommandService} from "./scalper-hot-key-command.service";
import {TerminalSettingsService} from "@terminal-core-lib/features/terminal-settings/services/terminal-settings.service";
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes,
  ScalperOrderBookMouseAction,
  ScalperOrderBookMouseActionsMap
} from "@terminal-core-lib/features/terminal-settings/terminal-settings.types";
import {ScalperOrderBookDataContext} from "../types/scalper-order-book-data-context.types";
import {
  BodyRow,
  CurrentOrderDisplay
} from "../types/scalper-order-book.types";
import {ScalperCommand} from "../types/scalper-command.types";
import {Side} from '@terminal-core-lib/common/types/side.types';
import {
  PriceUnits,
  ScalperOrderBookWidgetSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {CancelOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/cancel-orders-command';
import {ClosePositionByMarketCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/close-position-by-market-command';
import {SubmitMarketOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-market-order-command';
import {ReversePositionByMarketCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/reverse-position-by-market-command';
import {
  StopLimitOrderTracker,
  SubmitStopLimitOrderCommand
} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-stop-limit-order-command';
import {
  SetStopLossCommand,
  StopMarketOrderTracker
} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/set-stop-loss-command';
import {
  LimitOrderTracker,
  SubmitLimitOrderCommand
} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-limit-order-command';
import {SubmitBestPriceOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-best-price-order-command';
import {GetBestOfferCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/get-best-offer-command';
import {UpdateOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/update-orders-command';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {TerminalSettingsHelper} from '@terminal-core-lib/features/terminal-settings/utils/terminal-settings.helper';
import {BracketOptions} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/bracket-command';

@Injectable()
export class ScalperCommandProcessorService {
  private readonly hotkeysService = inject(ScalperHotKeyCommandService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly cancelOrdersCommand = inject(CancelOrdersCommand);

  private readonly closePositionByMarketCommand = inject(ClosePositionByMarketCommand);

  private readonly submitMarketOrderCommand = inject(SubmitMarketOrderCommand);

  private readonly reversePositionByMarketCommand = inject(ReversePositionByMarketCommand);

  private readonly submitStopLimitOrderCommand = inject(SubmitStopLimitOrderCommand);

  private readonly setStopLossCommand = inject(SetStopLossCommand);

  private readonly submitLimitOrderCommand = inject(SubmitLimitOrderCommand);

  private readonly submitBestPriceOrderCommand = inject(SubmitBestPriceOrderCommand);

  private readonly getBestOfferCommand = inject(GetBestOfferCommand);

  private readonly updateOrdersCommand = inject(UpdateOrdersCommand);

  private mouseActionsMap$: Observable<ScalperOrderBookMouseActionsMap> | null = null;

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
          updates: {price: row.price},
          silent: settings.widgetSettings.enableMouseClickSilentOrders,
          allowMargin: settings.widgetSettings.allowMargin
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
                          orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey),
                          allowMargin: settings.widgetSettings.allowMargin
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
                          orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey),
                          allowMargin: settings.widgetSettings.allowMargin
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
      this.marketOrderAction(Side.Sell, dataContext, true);
      return;
    }

    if (commandType === ActiveOrderBookHotKeysTypes.buyMarket) {
      this.marketOrderAction(Side.Buy, dataContext, true);
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
                targetInstrumentBoard: settings.widgetSettings.instrumentGroup ?? null,
                allowMargin: settings.widgetSettings.allowMargin
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
              exchange: x.targetInstrument.exchange,
              portfolio: x.ownedPortfolio.portfolio,
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
                        orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey),
                        allowMargin: settings.widgetSettings.allowMargin
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
    this.mouseActionsMap$ ??= this.terminalSettingsService.getSettings().pipe(
      map(x => x.scalperOrderBookMouseActions ?? TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1()),
      shareReplay(1)
    );

    return this.mouseActionsMap$;
  }

  private processClick(btn: 'left' | 'right', e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.getMouseActionsMap().pipe(
      take(1),
      map(map => {
        return map.actions.find(a =>
            a.button === btn
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
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

  private getActionMethod(action: ScalperOrderBookMouseAction): (row: {
    price: number;
  }, dataContext: ScalperOrderBookDataContext) => void {
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
                  orderTracker: this.getStopLimitOrderTracker(dataContext, portfolioKey),
                  allowMargin: settings.widgetSettings.allowMargin
                });
              }
            );
          });
      });
  }

  private getLimitOrderTracker(dataContext: ScalperOrderBookDataContext, targetPortfolio: PortfolioKey): LimitOrderTracker {
    return {
      beforeOrderCreated: (order): void => {
        if (order.meta?.trackId != null) {
          dataContext.addLocalOrder({
            orderId: order.meta!.trackId!,
            type: OrderType.Limit,
            side: order.side,
            displayVolume: order.quantity,
            price: order.price,
            targetInstrument: order.instrument,
            ownedPortfolio: targetPortfolio,
            isDirty: true
          });
        }
      },
      orderProcessed: localId => dataContext.removeLocalOrder(localId)
    };
  }

  private getStopLimitOrderTracker(dataContext: ScalperOrderBookDataContext, targetPortfolio: PortfolioKey): StopLimitOrderTracker {
    return {
      beforeOrderCreated: (order): void => {
        if (order.meta?.trackId != null) {
          dataContext.addLocalOrder({
            orderId: order.meta!.trackId!,
            type: OrderType.StopLimit,
            side: order.side,
            displayVolume: order.quantity,
            price: order.price,
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            targetInstrument: order.instrument,
            ownedPortfolio: targetPortfolio,
            isDirty: true
          });
        }
      },
      orderProcessed: localId => dataContext.removeLocalOrder(localId)
    };
  }

  private getStopMarketOrderTracker(dataContext: ScalperOrderBookDataContext, targetPortfolio: PortfolioKey): StopMarketOrderTracker {
    return {
      beforeOrderCreated: (order): void => {
        if (order.meta?.trackId != null) {
          dataContext.addLocalOrder({
            orderId: order.meta!.trackId!,
            type: OrderType.StopMarket,
            side: order.side,
            displayVolume: order.quantity,
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            targetInstrument: order.instrument,
            ownedPortfolio: targetPortfolio,
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
              orderTracker: position != null
                ? this.getStopMarketOrderTracker(dataContext, position.ownedPortfolio)
                : undefined,
              allowMargin: settings.widgetSettings.allowMargin
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
                      orderTracker: this.getLimitOrderTracker(dataContext, portfolioKey),
                      allowMargin: settings.widgetSettings.allowMargin
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
      profitTriggerPriceRatio: settings.bracketsSettings?.topOrderPriceRatio ?? null,
      profitLimitPriceGapRatio: settings.bracketsSettings?.topOrderPriceGapRatio ?? null,
      lossTriggerPriceRatio: settings.bracketsSettings?.bottomOrderPriceRatio ?? null,
      lossLimitPriceGapRatio: settings.bracketsSettings?.bottomOrderPriceGapRatio ?? null,
      orderPriceUnits: settings.bracketsSettings?.orderPriceUnits ?? PriceUnits.Points,
      applyBracketOnClosing: settings.bracketsSettings?.useBracketsWhenClosingPosition ?? false,
      currentPosition
    };
  }

  private marketOrderAction(
    side: Side,
    dataContext: ScalperOrderBookDataContext,
    silent?: boolean
  ): void {
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
                      position => this.submitMarketOrderCommand.execute({
                        instrumentKey: settings.widgetSettings,
                        side,
                        quantity: workingVolume,
                        targetPortfolio: portfolioKey.portfolio,
                        bracketOptions: this.getBracketOptions(
                          settings.widgetSettings,
                          position
                        ),
                        priceStep: settings.instrument.minstep,
                        orderBook,
                        silent: silent ?? settings.widgetSettings.enableMouseClickSilentOrders,
                        allowMargin: settings.widgetSettings.allowMargin
                      })
                    );
                  }
                );
              });
          });
      });
  }
}
