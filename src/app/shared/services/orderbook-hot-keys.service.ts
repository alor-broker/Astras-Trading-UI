import { Inject, Injectable } from '@angular/core';
import { EventManager } from "@angular/platform-browser";
import { DOCUMENT } from "@angular/common";
import {
  forkJoin,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  take
} from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { PositionsService } from "./positions.service";
import { AuthService } from "./auth.service";
import { Store } from "@ngrx/store";
import { PortfolioKey } from "../models/portfolio-key.model";
import { getSelectedPortfolio } from "../../store/portfolios/portfolios.selectors";
import { User } from "../models/user/user.model";
import { Position } from "../models/positions/position.model";

@Injectable({providedIn: 'root'})
export class OrderbookHotKeysService {
  private hotkeysSub: Subscription = new Subscription();

  private orderBookEvent$ = new Subject<{ event: string, options?: any }>();
  public orderBookEventSub = this.orderBookEvent$.asObservable();

  constructor(
    private readonly eventManager: EventManager,
    @Inject(DOCUMENT) private document: Document,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService,
  ) {
  }

  addShortcut(): Observable<{ key: string }> {
    return new Observable(observer => {
      const handler = (e: KeyboardEvent) => {
        observer.next({
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
      .pipe(map(s => s.hotKeysSettings!))
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
                this.cancelOrderbookOrders();
                break;
              }
              case s.closeOrderbookPositions: {
                this.closeOrderbookPositions();
                break;
              }
              case s.reverseOrderbookPositions: {
                this.closeOrderbookPositions(true);
                break;
              }
              case s.buyMarket: {
                this.placeMarketOrder('buy');
                break;
              }
              case s.sellMarket: {
                this.placeMarketOrder('sell');
                break;
              }
              case s.sellBestOrder:
                this.sellOrBuyBestOrder('sell');
                break;
              case s.buyBestOrder:
                this.sellOrBuyBestOrder('buy');
                break;
              default:
                if (s.workingVolumes?.includes(e.key)) {
                  this.selectWorkingVolume(s.workingVolumes?.findIndex(wv => wv === e.key));
                }
                break;
            }
          });
      });
  }

  private cancelAllOrders() {
    this.orderBookEvent$.next({event: 'cancelAllOrders'});
  }

  private closeAllPositions() {
    this.getAllPositions()
      .subscribe(positions => this.orderBookEvent$.next({ event: 'closeAllPositions', options: positions }));
  }

  private getAllPositions(): Observable<Position[]> {
    return this.authService.currentUser$
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
      );
  }

  private cancelOrderbookOrders() {
    this.orderBookEvent$.next({event: 'cancelOrderbookOrders'});
  }

  private closeOrderbookPositions(isReversePosition = false) {
    this.getAllPositions()
      .subscribe(positions => this.orderBookEvent$.next({
        event: isReversePosition ? 'reverseOrderbookPositions' : 'closeOrderbookPositions',
        options: { positions }
      }));
  }

  private placeMarketOrder(side: string) {
    this.orderBookEvent$.next({event: 'placeMarketOrder', options: side});
  }

  private selectWorkingVolume(workingVolumeIndex: number) {
    this.orderBookEvent$.next({event: 'selectWorkingVolume', options: workingVolumeIndex});
  }

  private sellOrBuyBestOrder(side: string) {
    this.orderBookEvent$.next({ event: side });
  }
}
