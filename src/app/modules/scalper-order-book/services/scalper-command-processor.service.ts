import { Injectable } from '@angular/core';
import { TerminalCommand } from '../../../shared/models/terminal-command';
import { ScalperOrderBookDataContext } from '../models/scalper-order-book-data-context.model';
import { HotKeyCommandService } from '../../../shared/services/hot-key-command.service';
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
import { ScalperOrdersService } from './scalper-orders.service';
import { ScalperOrderBookCommands } from '../models/scalper-order-book-commands';
import { ScalperOrderBookWidgetSettings } from '../models/scalper-order-book-settings.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import {
  ScalperOrderBookMouseAction,
  ScalperOrderBookMouseActionsMap
} from '../../../shared/models/terminal-settings/terminal-settings.model';
import { TerminalSettingsHelper } from '../../../shared/utils/terminal-settings-helper';
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";

@Injectable({
  providedIn: 'root'
})
export class ScalperCommandProcessorService {
  private mouseActionsMap$: Observable<ScalperOrderBookMouseActionsMap> | null = null;

  constructor(
    private readonly hotkeysService: HotKeyCommandService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly scalperOrdersService: ScalperOrdersService) {
  }

  processLeftMouseClick(e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.processClick('left', e, row, dataContext);
  }

  processRightMouseClick(e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext): void {
    this.processClick('right', e, row, dataContext);
  }

  processHotkeyPress(command: TerminalCommand, isActive: boolean, dataContext: ScalperOrderBookDataContext): void {
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
        this.scalperOrdersService.updateOrders(
          orders,
          { price: row.price },
          settings.widgetSettings.enableMouseClickSilentOrders
        );
      }
    );
  }

  getPossibleActions(): Observable<ScalperOrderBookMouseAction[]> {
    return combineLatest([
      this.getMouseActionsMap(),
      this.hotkeysService.modifiers$
    ]).pipe(
      map(([availableActions, modifiers]) => {
        if(modifiers.shiftKey && !modifiers.altKey && !modifiers.ctrlKey) {
         return availableActions.actions
           .filter(x => x.modifier === 'shift')
           .map(x => x.action);
        }

        if(modifiers.ctrlKey && !modifiers.altKey && !modifiers.shiftKey) {
          return availableActions.actions
            .filter(x => x.modifier === 'ctrl')
            .map(x => x.action);
        }

        return [];
      })
    );
  }

  private handleAllCommands(command: TerminalCommand, dataContext: ScalperOrderBookDataContext): boolean {
    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.cancelLimitOrdersAll) {
      this.cancelLimitOrders(dataContext);
      return true;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.closePositionsByMarketAll) {
      this.closePositionsByMarket(dataContext);
      return true;
    }

    return false;
  }

  private handleCurrentOrderBookCommands(command: TerminalCommand, dataContext: ScalperOrderBookDataContext): void {
    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.cancelLimitOrdersCurrent) {
      this.cancelLimitOrders(dataContext);
      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.closePositionsByMarketCurrent) {
      this.closePositionsByMarket(dataContext);
      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.sellBestOrder) {
      this.placeBestOrder(dataContext, Side.Sell);
      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.buyBestOrder) {
      this.placeBestOrder(dataContext, Side.Buy);
      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.sellBestBid) {
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
                        position => this.scalperOrdersService.sellBestBid(settings.widgetSettings, settings.instrument, workingVolume!, orderBook, portfolioKey, position)
                      );
                    }

                  );
                });
            });
        });

      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.buyBestAsk) {
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
                        position => this.scalperOrdersService.buyBestAsk(settings.widgetSettings, settings.instrument, workingVolume!, orderBook, portfolioKey, position)
                      );
                    }

                  );
                });
            });
        });

      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.sellMarket) {
      this.placeMarketOrderSilent(dataContext, Side.Sell);
      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.buyMarket) {
      this.placeMarketOrderSilent(dataContext, Side.Buy);
      return;
    }

    if (command.type as ScalperOrderBookCommands === ScalperOrderBookCommands.reversePositionsByMarketCurrent) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithPosition(
            dataContext,
            position => {
              this.scalperOrdersService.reversePositionsByMarket(position, settings.widgetSettings.instrumentGroup ?? null);
            }
          );
        }
      );

      return;
    }
  }

  private cancelLimitOrders(dataContext: ScalperOrderBookDataContext): void {
    this.callWithCurrentOrders(
      dataContext,
      orders => {
        const limitOrders = orders.filter(x => x.type === 'limit');

        if (limitOrders.length > 0) {
          this.scalperOrdersService.cancelOrders(limitOrders);
        }
      });
  }

  private closePositionsByMarket(dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithPosition(
          dataContext,
          position => this.scalperOrdersService.closePositionsByMarket(position, settings.widgetSettings.instrumentGroup ?? null)
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
                      position => this.scalperOrdersService.placeBestOrder(settings.widgetSettings, settings.instrument, side, workingVolume!, orderBook, portfolioKey, position)
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
              portfolioKey => this.scalperOrdersService.placeMarketOrder(settings.widgetSettings, side, workingVolume, true, portfolioKey)
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
      if (!action) {
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
                this.scalperOrdersService.setStopLimit(
                  settings.widgetSettings,
                  row.price,
                  workingVolume,
                  side,
                  settings.widgetSettings.enableMouseClickSilentOrders,
                  portfolioKey
                );
              }
            );
          });
      });
  }

  private stopLossAction(row: { price: number }, dataContext: ScalperOrderBookDataContext): void {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithPortfolioKey(
          dataContext,
          portfolioKey => {
            this.callWithPosition(
              dataContext,
              position => {
                this.scalperOrdersService.setStopLoss(
                  row.price,
                  settings.widgetSettings.enableMouseClickSilentOrders,
                  position,
                  settings.widgetSettings.instrumentGroup ?? null,
                  portfolioKey
                );
              }
            );
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
                    this.scalperOrdersService.placeLimitOrder(
                      settings.widgetSettings,
                      settings.instrument,
                      side,
                      workingVolume,
                      row.price,
                      settings.widgetSettings.enableMouseClickSilentOrders,
                      portfolioKey,
                      position
                    );
                  }
                );
              }
            );
          });
      });
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
                this.scalperOrdersService.placeMarketOrder(
                  settings.widgetSettings,
                  side,
                  workingVolume,
                  settings.widgetSettings.enableMouseClickSilentOrders,
                  portfolioKey
                );
              }
            );
          });
      });
  }
}
