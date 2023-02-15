import { Injectable } from '@angular/core';
import { TerminalCommand } from '../../../shared/models/terminal-command';
import { ScalperOrderBookDataContext } from '../models/scalper-order-book-data-context.model';
import { HotKeyCommandService } from '../../../shared/services/hot-key-command.service';
import { Side } from '../../../shared/models/enums/side.model';
import {
  BodyRow,
  CurrentOrderDisplay,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';
import {
  filter,
  iif,
  take
} from 'rxjs';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import {
  map,
  switchMap
} from 'rxjs/operators';
import { ScalperOrdersService } from './scalper-orders.service';
import { ScalperOrderBookCommands } from '../models/scalper-order-book-commands';
import { ScalperOrderBookSettings } from '../models/scalper-order-book-settings.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';

@Injectable({
  providedIn: 'root'
})
export class ScalperCommandProcessorService {

  constructor(
    private readonly hotkeysService: HotKeyCommandService,
    private readonly scalperOrdersService: ScalperOrdersService) {
  }

  processLeftMouseClick(e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext) {
    if (row.rowType !== ScalperOrderBookRowType.Bid && row.rowType !== ScalperOrderBookRowType.Ask) {
      return;
    }

    if (e.ctrlKey) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithSelectedVolume(
            dataContext,
            workingVolume => {
              this.callWithPortfolioKey(
                dataContext,
                portfolioKey => {
                  this.scalperOrdersService.setStopLimitForRow(
                    settings.widgetSettings,
                    row,
                    workingVolume,
                    settings.widgetSettings.enableMouseClickSilentOrders,
                    portfolioKey
                  );
                }
              );
            });
        });

      return;
    }

    if (e.shiftKey) {
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
                    settings.widgetSettings.instrumentGroup,
                    portfolioKey
                  );
                }
              );
            }
          );
        }
      );

      return;
    }

    if (!e.shiftKey && !e.ctrlKey) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithSelectedVolume(
            dataContext,
            workingVolume => {
              this.callWithPortfolioKey(
                dataContext,
                portfolioKey => {
                  this.scalperOrdersService.placeLimitOrder(
                    settings.widgetSettings,
                    row.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell,
                    workingVolume,
                    row.price,
                    settings.widgetSettings.enableMouseClickSilentOrders,
                    portfolioKey
                  );
                }
              );
            });
        });
    }
  }

  processRightMouseClick(e: MouseEvent, row: BodyRow, dataContext: ScalperOrderBookDataContext) {
    if (row.rowType !== ScalperOrderBookRowType.Bid && row.rowType !== ScalperOrderBookRowType.Ask) {
      return;
    }

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
                  row.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy,
                  workingVolume,
                  settings.widgetSettings.enableMouseClickSilentOrders,
                  portfolioKey
                );
              }
            );
          });
      });
  }

  processHotkeyPress(command: TerminalCommand, isActive: boolean, dataContext: ScalperOrderBookDataContext) {
    if (this.handleAllCommands(command, dataContext)) {
      return;
    }

    if (!isActive) {
      return;
    }

    this.handleCurrentOrderBookCommands(command, dataContext);
  }

  private handleAllCommands(command: TerminalCommand, dataContext: ScalperOrderBookDataContext): boolean {
    if (command.type === ScalperOrderBookCommands.cancelLimitOrdersAll) {
      this.cancelLimitOrders(dataContext);
      return true;
    }

    if (command.type === ScalperOrderBookCommands.closePositionsByMarketAll) {
      this.closePositionsByMarket(dataContext);
      return true;
    }

    return false;
  }

  private handleCurrentOrderBookCommands(command: TerminalCommand, dataContext: ScalperOrderBookDataContext) {
    if (command.type === ScalperOrderBookCommands.cancelLimitOrdersCurrent) {
      this.cancelLimitOrders(dataContext);
      return;
    }

    if (command.type === ScalperOrderBookCommands.closePositionsByMarketCurrent) {
      this.closePositionsByMarket(dataContext);
      return;
    }

    if (command.type === ScalperOrderBookCommands.sellBestOrder) {
      this.placeBestOrder(dataContext, Side.Sell);
      return;
    }

    if (command.type === ScalperOrderBookCommands.buyBestOrder) {
      this.placeBestOrder(dataContext, Side.Buy);
      return;
    }

    if (command.type === ScalperOrderBookCommands.sellBestBid) {
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
                    portfolioKey => this.scalperOrdersService.sellBestBid(settings.instrument, workingVolume!, orderBook, portfolioKey)
                  );
                });
            });
        });

      return;
    }

    if (command.type === ScalperOrderBookCommands.buyBestAsk) {
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
                    portfolioKey => this.scalperOrdersService.buyBestAsk(settings.instrument, workingVolume!, orderBook, portfolioKey)
                  );
                });
            });
        });

      return;
    }

    if (command.type === ScalperOrderBookCommands.sellMarket) {
      this.placeMarketOrderSilent(dataContext, Side.Sell);
      return;
    }

    if (command.type === ScalperOrderBookCommands.buyMarket) {
      this.placeMarketOrderSilent(dataContext, Side.Buy);
      return;
    }

    if (command.type === ScalperOrderBookCommands.reversePositionsByMarketCurrent) {
      this.callWithSettings(
        dataContext,
        settings => {
          this.callWithPortfolioKey(
            dataContext,
            portfolioKey => {
              this.callWithPosition(
                dataContext,
                position => {
                  this.scalperOrdersService.reversePositionsByMarket(position, settings.widgetSettings.instrumentGroup, portfolioKey);
                }
              );
            }
          );
        }
      );

      return;
    }
  }

  private cancelLimitOrders(dataContext: ScalperOrderBookDataContext) {
    this.callWithCurrentOrders(
      dataContext,
      orders => {
        const limitOrders = orders.filter(x => x.type === 'limit');

        if (limitOrders.length > 0) {
          this.scalperOrdersService.cancelOrders(limitOrders);
        }
      });
  }

  private closePositionsByMarket(dataContext: ScalperOrderBookDataContext) {
    this.callWithSettings(
      dataContext,
      settings => {
        this.callWithPortfolioKey(
          dataContext,
          portfolioKey => {
            this.callWithPosition(
              dataContext,
              position => this.scalperOrdersService.closePositionsByMarket(position, settings.widgetSettings.instrumentGroup, portfolioKey)
            );
          }
        );
      }
    );
  }

  private placeBestOrder(dataContext: ScalperOrderBookDataContext, side: Side) {
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
                  portfolioKey => this.scalperOrdersService.placeBestOrder(settings.instrument, side, workingVolume!, orderBook, portfolioKey)
                );
              });
          });
      });
  }

  private callWithCurrentOrders(
    dataContext: ScalperOrderBookDataContext,
    action: (orders: CurrentOrderDisplay[]) => void) {
    dataContext.currentOrders$.pipe(
      take(1)
    ).subscribe(action);
  }

  private placeMarketOrderSilent(dataContext: ScalperOrderBookDataContext, side: Side) {
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
    action: (settings: { widgetSettings: ScalperOrderBookSettings, instrument: Instrument }) => void) {
    dataContext.extendedSettings$.pipe(
      take(1)
    ).subscribe(s => action(s));
  }

  private callWithPortfolioKey(
    dataContext: ScalperOrderBookDataContext,
    action: (portfolioKey: PortfolioKey) => void) {
    dataContext.currentPortfolio$.pipe(
      take(1)
    ).subscribe(p => action(p));
  }

  private callWithPosition(
    dataContext: ScalperOrderBookDataContext,
    action: (position: Position | null) => void) {
    dataContext.position$.pipe(
      take(1)
    ).subscribe(p => action(p));
  }

  private callWithCurrentOrderBook(
    dataContext: ScalperOrderBookDataContext,
    action: (orderBook: OrderbookData) => void) {
    dataContext.orderBookData$.pipe(
      take(1)
    ).subscribe(action);
  }

  private callWithSelectedVolume(
    dataContext: ScalperOrderBookDataContext,
    action: (workingVolume: number) => void) {
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
        filter(workingVolume => !!workingVolume),
        map(x => Math.abs(x!))
      )
      .subscribe(workingVolume => action(workingVolume!));
  }
}
