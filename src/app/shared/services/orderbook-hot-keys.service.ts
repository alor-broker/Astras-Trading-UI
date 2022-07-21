import {
  Inject,
  Injectable
} from '@angular/core';
import { EventManager } from "@angular/platform-browser";
import { DOCUMENT } from "@angular/common";
import {
  fromEvent,
  map,
  Observable,
  Subject,
  Subscription,
} from "rxjs";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { Side } from "../models/enums/side.model";

@Injectable({ providedIn: 'root' })
export class OrderbookHotKeysService {
  private hotkeysSub: Subscription = new Subscription();

  private orderBookEvent$ = new Subject<{ event: string, options?: any }>();
  public orderBookEventSub = this.orderBookEvent$.asObservable();

  constructor(
    private readonly eventManager: EventManager,
    @Inject(DOCUMENT) private document: Document,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
  }

  addShortcut(): Observable<{ key: string }> {
    return fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(map((e: KeyboardEvent) => ({ key: e.key })));
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
              case s.centerOrderbookKey: {
                this.centerOrderbookKey();
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
                this.placeMarketOrder(Side.Buy);
                break;
              }
              case s.sellMarket: {
                this.placeMarketOrder(Side.Sell);
                break;
              }
              case s.sellBestOrder:
                this.placeBestOrder(Side.Sell);
                break;
              case s.buyBestOrder:
                this.placeBestOrder(Side.Buy);
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
    this.orderBookEvent$.next({ event: 'cancelAllOrders' });
  }

  private centerOrderbookKey() {
    this.orderBookEvent$.next({ event: 'centerOrderbookKey' });
  }

  private closeAllPositions() {
    this.orderBookEvent$.next({ event: 'closeAllPositions' });
  }

  private cancelOrderbookOrders() {
    this.orderBookEvent$.next({ event: 'cancelOrderbookOrders' });
  }

  private closeOrderbookPositions(isReversePosition = false) {
    this.orderBookEvent$.next({
      event: isReversePosition ? 'reverseOrderbookPositions' : 'closeOrderbookPositions',
    });
  }

  private placeMarketOrder(side: Side) {
    this.orderBookEvent$.next({ event: 'placeMarketOrder', options: { side } });
  }

  private selectWorkingVolume(workingVolumeIndex: number) {
    this.orderBookEvent$.next({ event: 'selectWorkingVolume', options: { workingVolumeIndex } });
  }

  private placeBestOrder(side: Side) {
    this.orderBookEvent$.next({ event: 'placeBestOrder', options: { side } });
  }
}
