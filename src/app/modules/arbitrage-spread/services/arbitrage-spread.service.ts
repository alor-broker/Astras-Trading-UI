import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap } from "rxjs";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ArbitrageSpread } from "../models/arbitrage-spread.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { QuotesService } from "../../../shared/services/quotes.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { Side } from "../../../shared/models/enums/side.model";
import { PositionsService } from "../../../shared/services/positions.service";
import { AuthService } from "../../../shared/services/auth.service";
import { SubmitOrderResult } from "../../command/models/order.model";

@Injectable({
  providedIn: 'root'
})
export class ArbitrageSpreadService {
  private spreadsKey = 'arbitration-spreads';
  private spreads$ = new BehaviorSubject<ArbitrageSpread[]>([]);

  private shouldShowSpreadModal = new BehaviorSubject<boolean>(false);
  private spreadParams = new BehaviorSubject<ArbitrageSpread | null>(null);
  shouldShowSpreadModal$ = this.shouldShowSpreadModal.asObservable();
  spreadParams$ = this.spreadParams.asObservable();

  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly quotesService: QuotesService,
    private readonly orderService: OrderService,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService
  ) { }

  getSpreadsSubscription(): Observable<ArbitrageSpread[]> {
    const localStorageSpreads = this.localStorage.getItem(this.spreadsKey) as ArbitrageSpread[];

    if (localStorageSpreads) {
      this.spreads$.next(localStorageSpreads);
    }

    return this.spreads$.asObservable()
      .pipe(
        tap(spreads => this.saveSpreads(spreads)),
        switchMap(spreads => {
          if (!spreads.length) {
            return of([]);
          }

          return combineLatest(spreads.map(spread => {
            return combineLatest([
              this.quotesService.getQuotes(
                spread.firstLeg.instrument.symbol,
                spread.firstLeg.instrument.exchange,
                spread.firstLeg.instrument.instrumentGroup
              ),
              this.quotesService.getQuotes(
                spread.secondLeg.instrument.symbol,
                spread.secondLeg.instrument.exchange,
                spread.secondLeg.instrument.instrumentGroup
              ),
              this.authService.currentUser$
                .pipe(
                  take(1),
                  switchMap(user => this.positionsService.getAllByLogin(user.login!))
                )
            ])
              .pipe(
                map(([firstLeg, secondLeg, positions]) => ({
                  ...spread,
                  firstLeg: {
                    ...spread.firstLeg,
                    positionsCount: positions.find(p =>
                      p.exchange === spread.firstLeg.portfolio.exchange &&
                      p.portfolio === spread.firstLeg.portfolio.portfolio &&
                      p.symbol === spread.firstLeg.instrument.symbol
                    )?.qtyTFutureBatch ?? 0
                  },
                  secondLeg: {
                    ...spread.secondLeg,
                    positionsCount: positions.find(p =>
                      p.exchange === spread.secondLeg.portfolio.exchange &&
                      p.portfolio === spread.secondLeg.portfolio.portfolio &&
                      p.symbol === spread.secondLeg.instrument.symbol
                    )?.qtyTFutureBatch ?? 0
                  },
                  buySpread: firstLeg.ask * spread.firstLeg.quantity * spread.firstLeg.ratio -
                    secondLeg.bid * spread.secondLeg.quantity * spread.secondLeg.ratio,
                  sellSpread: firstLeg.bid * spread.firstLeg.quantity * spread.firstLeg.ratio -
                    secondLeg.ask * spread.secondLeg.quantity * spread.secondLeg.ratio
                }))
              );
          }));
        })
      );
  }

  addSpread(newSpread: ArbitrageSpread) {
    this.spreads$
      .pipe(take(1))
      .subscribe(spreads => {
        this.spreads$.next([
          {
            ...newSpread,
            id: GuidGenerator.newGuid(),
          },
          ...spreads]);
      });
  }

  editSpread(spread: ArbitrageSpread) {
    this.spreads$
      .pipe(take(1))
      .subscribe(spreads => {
        this.spreads$.next(spreads.map(spr => {
          if (spr.id !== spread.id) {
            return spr;
          }

          return {
            ...spr,
            ...spread
          };
        }));
      });
  }

  removeSpread(spreadId: string) {
    this.spreads$
      .pipe(take(1))
      .subscribe(spreads => {
        this.spreads$.next(spreads.filter(ext => ext.id !== spreadId));
      });
  }

  private saveSpreads(spreads: Array<ArbitrageSpread>) {
    this.localStorage.setItem(this.spreadsKey, spreads);
  }

  buySpread(spread: ArbitrageSpread, volume = 1, side: Side = Side.Buy): Observable<SubmitOrderResult | null> {
    return this.orderService.submitMarketOrder({
            instrument: spread.firstLeg.instrument,
            side: side,
            quantity: spread.firstLeg.quantity * volume
          }, spread.firstLeg.portfolio.portfolio)
      .pipe(
        switchMap((order) => {
          if (!order) {
            return of(null);
          }
          return this.orderService.submitMarketOrder({
            instrument: spread.secondLeg.instrument,
            side: side === Side.Sell ? Side.Buy : Side.Sell,
            quantity: spread.secondLeg.quantity * volume
          }, spread.secondLeg.portfolio.portfolio);
        })
      );
  }

  openSpreadModal(spread?: ArbitrageSpread | null) {
    this.spreadParams.next(spread ?? null);
    this.shouldShowSpreadModal.next(true);
  }

  closeSpreadModal() {
    this.spreadParams.next(null);
    this.shouldShowSpreadModal.next(false);
  }
}
