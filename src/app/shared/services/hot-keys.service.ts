import { Inject, Injectable } from '@angular/core';
import { EventManager } from "@angular/platform-browser";
import { DOCUMENT } from "@angular/common";
import { distinctUntilChanged, forkJoin, map, Observable, Subscription, switchMap, take } from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { OrderCancellerService } from "./order-canceller.service";
import { PositionsService } from "./positions.service";
import { AuthService } from "./auth.service";
import { Store } from "@ngrx/store";
import { PortfolioKey } from "../models/portfolio-key.model";
import { Order } from "../models/orders/order.model";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { getAllSettings, getSettingsByGuid } from "../../store/widget-settings/widget-settings.selectors";
import { OrderbookSettings } from "../models/settings/orderbook-settings.model";
import { getSelectedPortfolio } from "../../store/portfolios/portfolios.selectors";
import { User } from "../models/user/user.model";
import { Position } from "../models/positions/position.model";
import { CommandsService } from "../../modules/command/services/commands.service";
import { Side } from "../models/enums/side.model";

@Injectable({providedIn: 'root'})
export class HotKeysService {
  private hotkeysSub: Subscription = new Subscription();

  constructor(
    private readonly eventManager: EventManager,
    @Inject(DOCUMENT) private document: Document,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly orderCancellerService: OrderCancellerService,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService,
    private readonly commandsService: CommandsService,
    private readonly http: HttpClient
  ) {
  }

  addShortcut(): Observable<{ guid: string | null | undefined, key: string }> {
    return new Observable(observer => {
      const handler = (e: KeyboardEvent) => {
        const focusedOrderbookEl = this.document.querySelector('ats-order-book:hover');
        const orderbookGuid = focusedOrderbookEl?.getAttribute(
          focusedOrderbookEl?.getAttributeNames().find(name => name.includes('guid')) || ''
        );

        e.preventDefault();
        observer.next({
          guid: orderbookGuid,
          key: e.key
        });
      };

      const dispose = this.eventManager.addEventListener(
        this.document.body, 'keydown', handler
      );

      return () => {
        dispose();
      };
    });
  }

  bindShortCuts() {
    this.terminalSettingsService.getSettings()
      .pipe(
        distinctUntilChanged((prev, curr) =>
          prev.cancelOrdersKey === curr.cancelOrdersKey
          && prev.closePositionsKey === curr.closePositionsKey
          && prev.centerOrderbookKey === curr.centerOrderbookKey
        )
      )
      .subscribe(s => {
        if (this.hotkeysSub) {
          this.hotkeysSub.unsubscribe();
        }

        this.hotkeysSub = this.addShortcut()
          .subscribe(e => {
            switch (e.key) {
              case s.cancelOrdersKey: {
                this.cancelAllOrders();
                break;
              }
              case s.closePositionsKey: {
                this.closeAllPositions();
                break;
              }
              case s.cancelOrderbookOrders: {
                this.cancelOrderbookOrders(e.guid);
                break;
              }
              case s.closeOrderbookPositions: {
                this.closeOrderbookPositions(e.guid);
                break;
              }
              case s.reverseOrderbookPositions: {
                this.closeOrderbookPositions(e.guid, true);
                break;
              }
              case s.buyMarket: {
                this.placeMarketOrder(e.guid, 'buy');
                break;
              }
              case s.sellMarket: {
                this.placeMarketOrder(e.guid, 'sell');
                break;
              }
            }
          });
      });
  }

  private cancelAllOrders() {
    this.store.select(getAllSettings).pipe(
      take(1),
      map(
        settings => settings
          .filter(s => s.title?.includes('Стакан')) as OrderbookSettings[]
      ),
      switchMap(
        settings => this.store.select(getSelectedPortfolio)
          .pipe(
            take(1),
            map(p => settings.map(s => ({exchange: s.exchange, portfolio: p?.portfolio})))
          )
      ),
      switchMap(reqs => forkJoin(reqs.map(req => this.getAllOrders(req as PortfolioKey))))
    )
      .subscribe((ordersArr: Order[][]) => {
        ordersArr.forEach(orders => {
          orders
            .filter(order => order.status === 'working')
            .forEach(order => {
              const cancelCommand = {
                orderid: order.id,
                portfolio: order.portfolio,
                exchange: order.exchange,
                stop: false
              };

              this.orderCancellerService.cancelOrder(cancelCommand)
                .subscribe();
            });
        });
      });
  }

  private closeAllPositions() {
    this.authService.currentUser$
      .pipe(
        map((user: User) => user.login),
        switchMap((login) => forkJoin([
          this.positionsService.getAllByLogin(login).pipe(take(1)),
          this.store.select(getSelectedPortfolio).pipe(take(1))
        ])),
        map((
          [positions, p]: [Position[], PortfolioKey | null]) =>
          positions.filter(pos => pos.portfolio === p?.portfolio)
        ),
        switchMap(positions => this.store.select(getAllSettings)
          .pipe(
            take(1),
            map(
              settings => settings
                .filter(s => s.title?.includes('Стакан')) as OrderbookSettings[]
            ),
            map(
              settings => positions
                .filter(
                  pos =>
                    settings.map(s => s.exchange).includes(pos.exchange) && settings.map(s => s.symbol).includes(pos.symbol)
                )
            )
          ),
        )
      )
      .subscribe((positions: Position[]) => {
        positions.forEach(pos => {
          if (!pos.qtyTFuture) {
            return;
          }

          this.commandsService.setMarketCommand({
            side: pos.qtyTFuture > 0 ? 'sell' : 'buy',
            quantity: pos.qtyTFuture,
            instrument: {symbol: pos.symbol, exchange: pos.exchange},
            user: {portfolio: pos.portfolio, exchange: pos.exchange}
          });
          this.commandsService.submitMarket(pos.qtyTFuture > 0 ? Side.Sell : Side.Buy,).subscribe();
        });
      });
  }

  private cancelOrderbookOrders(guid: string | null | undefined) {
    if (!guid) {
      return;
    }

    this.store.select(getSettingsByGuid(guid))
      .pipe(
        take(1),
        switchMap(
          s => this.store.select(getSelectedPortfolio)
            .pipe(map(p => ({exchange: (s as OrderbookSettings).exchange, portfolio: p?.portfolio})))
        ),
        switchMap(req => this.getAllOrders(req as PortfolioKey))
      )
      .subscribe(
        orders => orders
          .filter(order => order.status === 'working')
          .forEach(order => {
            const cancelCommand = {
              orderid: order.id,
              portfolio: order.portfolio,
              exchange: order.exchange,
              stop: false
            };

            this.orderCancellerService.cancelOrder(cancelCommand)
              .subscribe();
          })
      );
  }

  private closeOrderbookPositions(guid: string | null | undefined, isReversePosition = false) {
    if (!guid) {
      return;
    }

    this.authService.currentUser$
      .pipe(
        map((user: User) => user.login),
        switchMap((login) => forkJoin([
          this.positionsService.getAllByLogin(login).pipe(take(1)),
          this.store.select(getSelectedPortfolio).pipe(take(1))
        ])),
        map((
          [positions, p]: [Position[], PortfolioKey | null]) =>
          positions.filter(pos => pos.portfolio === p?.portfolio)
        ),
        switchMap(positions => this.store.select(getSettingsByGuid(guid))
          .pipe(
            take(1),
            map(
              s => positions.filter(pos =>
                pos.exchange === (s as OrderbookSettings).exchange && pos.symbol === (s as OrderbookSettings).symbol)
            )
          ))
      )
      .subscribe((positions: Position[]) => {
        positions.forEach(pos => {
          if (!pos.qtyTFuture) {
            return;
          }

          this.commandsService.setMarketCommand({
            side: pos.qtyTFuture > 0 ? 'sell' : 'buy',
            quantity: isReversePosition ? pos.qtyTFuture * 2 : pos.qtyTFuture,
            instrument: {symbol: pos.symbol, exchange: pos.exchange},
            user: {portfolio: pos.portfolio, exchange: pos.exchange}
          });
          this.commandsService.submitMarket(pos.qtyTFuture > 0 ? Side.Sell : Side.Buy,).subscribe();
        });
      });
  }

  private placeMarketOrder(guid: string | null | undefined, side: string) {
    if (!guid) {
      return;
    }

    const workVol = 10;

    forkJoin([
      this.store.select(getSelectedPortfolio).pipe(take(1)),
      this.store.select(getSettingsByGuid(guid)).pipe(take(1))
    ])
      .subscribe(([p, s]) => {
        this.commandsService.setMarketCommand({
          side,
          quantity: workVol,
          instrument: {symbol: (s as OrderbookSettings).symbol, exchange: (s as OrderbookSettings).exchange},
          user: {portfolio: p!.portfolio, exchange: (s as OrderbookSettings).exchange}
        });
        this.commandsService.submitMarket(side === 'sell' ? Side.Sell : Side.Buy).subscribe();
      });
  }

  private getAllOrders(portfolioKey: PortfolioKey): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${environment.apiUrl}/md/v2/clients/${portfolioKey.exchange}/${portfolioKey.portfolio}/orders`
    )
      .pipe(take(1));
  }
}
