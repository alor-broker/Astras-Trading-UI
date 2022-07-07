import { Inject, Injectable } from '@angular/core';
import { EventManager } from "@angular/platform-browser";
import { DOCUMENT } from "@angular/common";
import { distinctUntilChanged, forkJoin, map, Observable, Subscription, switchMap, take, tap, zip } from "rxjs";
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
import { OrderbookSettings } from "../models/settings/orderbook-settings.model";
import { getSelectedPortfolio } from "../../store/portfolios/portfolios.selectors";

type Options = {
  element: any;
  keys: string;
};

@Injectable({providedIn: 'root'})
export class HotKeysService {
  private hotkeysSub: Subscription = new Subscription();

  defaults: Partial<Options> = {
    element: this.document
  };

  constructor(
    private readonly eventManager: EventManager,
    @Inject(DOCUMENT) private document: Document,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly orderCancellerService: OrderCancellerService,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {
  }

  addShortcut(options: Partial<Options>): Observable<KeyboardEvent> {
    const merged = { ...this.defaults, ...options };
    const event = `keydown`;

    return new Observable(observer => {
      const handler = (e: KeyboardEvent) => {
        if (e.key !== merged.keys) return;
        e.preventDefault();
        observer.next(e);
      };

      const dispose = this.eventManager.addEventListener(
        merged.element, event, handler
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

        this.hotkeysSub = zip([
          this.addCancelOrdersHotkey(s.cancelOrdersKey!),
          this.addShortcut({ keys: s.closePositionsKey })
            .pipe(
              switchMap(() => this.authService.currentUser$),
              map(user => user.login),
              switchMap((login) => this.positionsService.getAllByLogin(login)),
              tap((positions) => {
                console.log(positions);
              })
            ),
          this.addShortcut({keys: s.centerOrderbookKey})
            .pipe(
              tap((e: KeyboardEvent) => {
                console.log(e.key);
              })
            ),
        ])
          .subscribe();
      });
  }

  private addCancelOrdersHotkey(keys: string) {
    return this.addShortcut({ keys })
      .pipe(
        switchMap(() => this.store.select(getAllSettings).pipe(take(1))),
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
        switchMap(reqs => forkJoin(reqs.map(req => this.getAllOrders(req as PortfolioKey)))),
        tap((ordersArr: Order[][]) => {
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
        })
      );
  }

  getAllOrders(portfolioKey: PortfolioKey): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${environment.apiUrl}/md/v2/clients/${portfolioKey.exchange}/${portfolioKey.portfolio}/orders`
    )
      .pipe(take(1));
  }
}
