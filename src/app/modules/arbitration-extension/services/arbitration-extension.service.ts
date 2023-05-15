import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap } from "rxjs";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ArbitrationExtension, ExtensionLeg } from "../models/arbitration-extension.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { QuotesService } from "../../../shared/services/quotes.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { Side } from "../../../shared/models/enums/side.model";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { mapWith } from "../../../shared/utils/observable-helper";

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
    private readonly dashboardService: DashboardContextService
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
              )
            ])
              .pipe(
                map(([ firstLeg, secondLeg ]) => ({ firstLeg, secondLeg })),
                map(quotes => ({
                  ...ext,
                  buyExtension: quotes.firstLeg.ask * ext.firstLeg.quantity * ext.firstLeg.ratio -
                    quotes.secondLeg.bid * ext.secondLeg.quantity * ext.secondLeg.ratio,
                  sellExtension: quotes.firstLeg.bid * ext.firstLeg.quantity * ext.firstLeg.ratio -
                    quotes.secondLeg.ask * ext.secondLeg.quantity * ext.secondLeg.ratio
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

  buyExtension(firstLeg: ExtensionLeg, secondLeg: ExtensionLeg) {
    return this.dashboardService.selectedPortfolio$
      .pipe(
        take(1),
        mapWith(
          (portfolio) => this.orderService.submitMarketOrder({
            instrument: firstLeg.instrument,
            side: Side.Buy,
            quantity: firstLeg.quantity
          }, portfolio.portfolio),
          (portfolio, order) => ({ portfolio, order })
        ),
        switchMap(({ portfolio, order }) => {
          if (!order) {
            return of(null);
          }
          return this.orderService.submitMarketOrder({
            instrument: secondLeg.instrument,
            side: Side.Sell,
            quantity: secondLeg.quantity
          }, portfolio.portfolio);
        })
      );
  }
}
