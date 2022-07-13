import { Inject, Injectable } from '@angular/core';
import { EventManager } from "@angular/platform-browser";
import { DOCUMENT } from "@angular/common";
import {
  BehaviorSubject,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  take
} from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { OrderCancellerService } from "./order-canceller.service";
import { PositionsService } from "./positions.service";
import { AuthService } from "./auth.service";
import { Store } from "@ngrx/store";
import { PortfolioKey } from "../models/portfolio-key.model";
import { Order } from "../models/orders/order.model";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { getAllSettings } from "../../store/widget-settings/widget-settings.selectors";
import { getSelectedPortfolio } from "../../store/portfolios/portfolios.selectors";
import { User } from "../models/user/user.model";
import { Position } from "../models/positions/position.model";
import { CommandsService } from "../../modules/command/services/commands.service";
import { Side } from "../models/enums/side.model";
import { VerticalOrderBookSettings } from "../models/settings/vertical-order-book-settings.model";
import { mapWith } from "../utils/observable-helper";

@Injectable({providedIn: 'root'})
export class HotKeysService {
  private hotkeysSub: Subscription = new Subscription();

  private orderBookEvent$ = new Subject<{ event: string, guid: string, options?: any }>();
  public orderBookEventSub = this.orderBookEvent$.asObservable();

  private activeOrderBookGuid$ = new BehaviorSubject<string | null>(null);

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

  activeOrderbookChange(guid: string | null) {
    this.activeOrderBookGuid$.next(guid);
  }

  addShortcut(): Observable<{ settings: VerticalOrderBookSettings | null, key: string }> {
    return new Observable(observer => {
      const handler = (e: KeyboardEvent) => {

        this.store.select(getAllSettings)
          .pipe(take(1))
          .subscribe(settings => {
            observer.next({
              settings: this.activeOrderBookGuid$.getValue()
                ? settings.find(s => s.guid === this.activeOrderBookGuid$.getValue()) as VerticalOrderBookSettings
                : null,
              key: e.key
            });
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
          && prev.cancelOrderbookOrders === curr.cancelOrderbookOrders
          && prev.closeOrderbookPositions === curr.closeOrderbookPositions
          && prev.reverseOrderbookPositions === curr.reverseOrderbookPositions
          && prev.buyMarket === curr.buyMarket
          && prev.sellMarket === curr.sellMarket
          && prev.selectWorkingVolume1 === curr.selectWorkingVolume1
          && prev.selectWorkingVolume2 === curr.selectWorkingVolume2
          && prev.selectWorkingVolume3 === curr.selectWorkingVolume3
          && prev.selectWorkingVolume4 === curr.selectWorkingVolume4
          && prev.sellBestOrder === curr.sellBestOrder
          && prev.buyBestOrder === curr.buyBestOrder
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
                this.cancelOrderbookOrders(e.settings);
                break;
              }
              case s.closeOrderbookPositions: {
                this.closeOrderbookPositions(e.settings);
                break;
              }
              case s.reverseOrderbookPositions: {
                this.closeOrderbookPositions(e.settings, true);
                break;
              }
              case s.buyMarket: {
                this.placeMarketOrder(e.settings, 'buy');
                break;
              }
              case s.sellMarket: {
                this.placeMarketOrder(e.settings, 'sell');
                break;
              }
              case s.selectWorkingVolume1:
                this.selectWorkingVolume(e.settings, 1);
                break;
              case s.selectWorkingVolume2:
                this.selectWorkingVolume(e.settings, 2);
                break;
              case s.selectWorkingVolume3:
                this.selectWorkingVolume(e.settings, 3);
                break;
              case s.selectWorkingVolume4:
                this.selectWorkingVolume(e.settings, 4);
                break;
              case s.sellBestOrder:
                this.sellOrBuyBestOrder(e.settings, 'sell');
                break;
              case s.buyBestOrder:
                this.sellOrBuyBestOrder(e.settings, 'buy');
                break;
            }
          });
      });
  }

  private cancelAllOrders() {
    this.store.select(getAllSettings).pipe(
      take(1),
      map(
        settings => settings
          .filter(s => 'showSpreadItems' in s) as VerticalOrderBookSettings[]
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
        mapWith(
          () => this.store.select(getAllSettings).pipe(
            take(1),
            map(
              settings => settings
                .filter(s => 'showSpreadItems' in s) as VerticalOrderBookSettings[]
            )
          ),
          (positions, settings) => positions
            .filter(
              pos =>
                settings.map(s => s.exchange).includes(pos.exchange) && settings.map(s => s.symbol).includes(pos.symbol)
            )
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

  private cancelOrderbookOrders(settings: VerticalOrderBookSettings | null) {
    if (!settings) {
      return;
    }

    this.store.select(getSelectedPortfolio)
      .pipe(
        take(1),
        switchMap(p => this.getAllOrders({portfolio: p!.portfolio, exchange: settings.exchange}))
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

  private closeOrderbookPositions(settings: VerticalOrderBookSettings | null, isReversePosition = false) {
    if (!settings) {
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
          positions.filter(
            pos => pos.portfolio === p?.portfolio &&
              pos.exchange === settings.exchange &&
              pos.symbol === settings.symbol
          )
        )
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

  private placeMarketOrder(settings: VerticalOrderBookSettings | null, side: string) {
    if (!settings) {
      return;
    }

    this.store.select(getSelectedPortfolio).pipe(take(1))
      .subscribe(p => {
        this.orderBookEvent$.next({
          event: 'placeMarketOrder',
          guid: settings.guid,
          options: {
            symbol: settings.symbol,
            exchange: settings.exchange,
            portfolio: p!.portfolio,
            side
          }
        });
      });
  }

  private selectWorkingVolume(settings: VerticalOrderBookSettings | null, workingVolumeNum: number) {
    if (!settings) {
      return;
    }

    this.orderBookEvent$.next({event: 'selectWorkingVolume', guid: settings.guid, options: workingVolumeNum});
  }

  private sellOrBuyBestOrder(settings: VerticalOrderBookSettings | null, side: string) {
    if (!settings) {
      return;
    }

    this.store.select(getSelectedPortfolio)
      .pipe(take(1))
      .subscribe(p => {
        this.orderBookEvent$.next({
          event: side,
          guid: settings.guid,
          options: {
            portfolio: p,
            settings: settings
          }
        });
      });
  }

  private getAllOrders(portfolioKey: PortfolioKey): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${environment.apiUrl}/md/v2/clients/${portfolioKey.exchange}/${portfolioKey.portfolio}/orders`
    )
      .pipe(take(1));
  }
}
