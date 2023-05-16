import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap } from "rxjs";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ArbitrationExtension, ExtensionLeg } from "../models/arbitration-extension.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { QuotesService } from "../../../shared/services/quotes.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { Side } from "../../../shared/models/enums/side.model";
import { PositionsService } from "../../../shared/services/positions.service";
import { AuthService } from "../../../shared/services/auth.service";

@Injectable({
  providedIn: 'root'
})
export class ArbitrationExtensionService {
  private extensionsKey = 'arbitration-extensions';
  private extensions$ = new BehaviorSubject<ArbitrationExtension[]>([]);

  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly quotesService: QuotesService,
    private readonly orderService: OrderService,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService
  ) { }

  getExtensionsSubscription(): Observable<ArbitrationExtension[]> {
    const localStorageExtensions = this.localStorage.getItem(this.extensionsKey) as ArbitrationExtension[];

    if (localStorageExtensions) {
      this.extensions$.next(localStorageExtensions);
    }

    return this.extensions$.asObservable()
      .pipe(
        tap(extensions => this.saveExtensions(extensions)),
        switchMap(exts => {
          if (!exts.length) {
            return of([]);
          }

          return combineLatest(exts.map(ext => {
            return combineLatest([
              this.quotesService.getQuotes(
                ext.firstLeg.instrument.symbol,
                ext.firstLeg.instrument.exchange,
                ext.firstLeg.instrument.instrumentGroup
              ),
              this.quotesService.getQuotes(
                ext.secondLeg.instrument.symbol,
                ext.secondLeg.instrument.exchange,
                ext.secondLeg.instrument.instrumentGroup
              ),
              this.authService.currentUser$
                .pipe(
                  take(1),
                  switchMap(user => this.positionsService.getAllByLogin(user.login!))
                )
            ])
              .pipe(
                map(([firstLeg, secondLeg, positions]) => ({
                  ...ext,
                  firstLeg: {
                    ...ext.firstLeg,
                    positionsCount: positions.find(p =>
                      p.exchange === ext.firstLeg.portfolio.exchange &&
                      p.portfolio === ext.firstLeg.portfolio.portfolio &&
                      p.symbol === ext.firstLeg.instrument.symbol
                    )?.qtyTFutureBatch ?? 0
                  },
                  secondLeg: {
                    ...ext.secondLeg,
                    positionsCount: positions.find(p =>
                      p.exchange === ext.secondLeg.portfolio.exchange &&
                      p.portfolio === ext.secondLeg.portfolio.portfolio &&
                      p.symbol === ext.secondLeg.instrument.symbol
                    )?.qtyTFutureBatch ?? 0
                  },
                  buyExtension: firstLeg.ask * ext.firstLeg.quantity * ext.firstLeg.ratio -
                    secondLeg.bid * ext.secondLeg.quantity * ext.secondLeg.ratio,
                  sellExtension: firstLeg.bid * ext.firstLeg.quantity * ext.firstLeg.ratio -
                    secondLeg.ask * ext.secondLeg.quantity * ext.secondLeg.ratio
                }))
              );
          }));
        })
      );
  }

  addExtension(newExt: ArbitrationExtension) {
    this.extensions$
      .pipe(take(1))
      .subscribe(extensions => {
        this.extensions$.next([
          {
            ...newExt,
            id: GuidGenerator.newGuid(),
          },
          ...extensions]);
      });
  }

  editExtension(extension: ArbitrationExtension) {
    this.extensions$
      .pipe(take(1))
      .subscribe(extensions => {
        this.extensions$.next(extensions.map(ext => {
          if (ext.id !== extension.id) {
            return ext;
          }

          return {
            ...ext,
            ...extension
          };
        }));
      });
  }

  removeExtension(extId: string) {
    this.extensions$
      .pipe(take(1))
      .subscribe(extensions => {
        this.extensions$.next(extensions.filter(ext => ext.id !== extId));
      });
  }

  saveExtensions(extensions: Array<ArbitrationExtension>) {
    this.localStorage.setItem(this.extensionsKey, extensions);
  }

  buyExtension(firstLeg: ExtensionLeg, secondLeg: ExtensionLeg, volume = 1) {
    return this.orderService.submitMarketOrder({
            instrument: firstLeg.instrument,
            side: Side.Buy,
            quantity: firstLeg.quantity * volume
          }, firstLeg.portfolio.portfolio)
      .pipe(
        switchMap((order) => {
          if (!order) {
            return of(null);
          }
          return this.orderService.submitMarketOrder({
            instrument: secondLeg.instrument,
            side: Side.Sell,
            quantity: secondLeg.quantity
          }, secondLeg.portfolio.portfolio);
        })
      );
  }
}
