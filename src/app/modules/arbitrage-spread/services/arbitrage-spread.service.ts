import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap } from "rxjs";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ArbitrageSpread, SpreadLeg } from "../models/arbitrage-spread.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { QuotesService } from "../../../shared/services/quotes.service";
import { Side } from "../../../shared/models/enums/side.model";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { OrderCommandResult } from "../../../shared/models/orders/new-order.model";
import { Position } from "../../../shared/models/positions/position.model";
import { Quote } from "../../../shared/models/quotes/quote.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

@Injectable()
export class ArbitrageSpreadService {
  private readonly localStorage = inject(LocalStorageService);
  private readonly quotesService = inject(QuotesService);
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly spreadsKey = 'arbitration-spreads';
  private readonly spreads$ = new BehaviorSubject<ArbitrageSpread[]>([]);

  private readonly shouldShowSpreadModal = new BehaviorSubject<boolean>(false);
  private readonly spreadParams = new BehaviorSubject<ArbitrageSpread | null>(null);
  shouldShowSpreadModal$ = this.shouldShowSpreadModal.asObservable();
  spreadParams$ = this.spreadParams.asObservable();

  getSpreadsSubscription(): Observable<ArbitrageSpread[]> {
    const localStorageSpreads = this.localStorage.getItem(this.spreadsKey) as ArbitrageSpread[] | undefined;

    if ((localStorageSpreads ?? []).length) {
      this.spreads$.next(localStorageSpreads!);
    }

    return this.spreads$.asObservable()
      .pipe(
        tap(spreads => this.saveSpreads(spreads)),
        switchMap((spreads: ArbitrageSpread[]) => {
          if (!spreads.length) {
            return of([]);
          }

          return combineLatest(spreads.map(spread => {
            const spreadLegsRequests: [
              Observable<Quote>,
              Observable<Position[]>,
              Observable<Quote>,
              Observable<Position[]>,
              Observable<Quote | null>,
              Observable<Position[]>
            ] = [
              this.quotesService.getQuotes(
                spread.firstLeg.instrument.symbol,
                spread.firstLeg.instrument.exchange,
                spread.firstLeg.instrument.instrumentGroup
              ),
              this.portfolioSubscriptionsService.getAllPositionsSubscription(
                spread.firstLeg.portfolio.portfolio,
                spread.firstLeg.portfolio.exchange
              ),
              this.quotesService.getQuotes(
                spread.secondLeg.instrument.symbol,
                spread.secondLeg.instrument.exchange,
                spread.secondLeg.instrument.instrumentGroup
              ),
              this.portfolioSubscriptionsService.getAllPositionsSubscription(
                spread.secondLeg.portfolio.portfolio,
                spread.secondLeg.portfolio.exchange
              ),
              spread.isThirdLeg
? this.quotesService.getQuotes(
                spread.thirdLeg.instrument.symbol,
                spread.thirdLeg.instrument.exchange,
                spread.thirdLeg.instrument.instrumentGroup
              )
: of(null),
              spread.isThirdLeg
? this.portfolioSubscriptionsService.getAllPositionsSubscription(
                spread.thirdLeg.portfolio.portfolio,
                spread.thirdLeg.portfolio.exchange
              )
: of([])
            ];

            return combineLatest(spreadLegsRequests)
              .pipe(
                map(([firstLeg, firstLegPositions, secondLeg, secondLegPositions, thirdLeg, thirdLegPositions]) => {
                  const thirdLegSpread: { thirdLeg?: SpreadLeg } = {};

                  let buySpread = (spread.calculationFormula ?? 'L1-L2')
                    .replace(
                      /L1/g,
                      this.escapeNegativeValues(firstLeg!.ask * spread.firstLeg.quantity * spread.firstLeg.ratio)
                    );

                  buySpread = buySpread.replace(
                    /L2/g,
                    this.escapeNegativeValues((spread.secondLeg.side === Side.Buy ? secondLeg!.ask : secondLeg!.bid) * spread.secondLeg.quantity * spread.secondLeg.ratio)
                  );

                  let sellSpread = (spread.calculationFormula ?? 'L1-L2')
                    .replace(
                      /L1/g,
                      this.escapeNegativeValues(firstLeg!.bid * spread.firstLeg.quantity * spread.firstLeg.ratio)
                    );

                  sellSpread = sellSpread.replace(
                    /L2/g,
                    this.escapeNegativeValues((spread.secondLeg.side === Side.Buy ? secondLeg!.bid : secondLeg!.ask) * spread.secondLeg.quantity * spread.secondLeg.ratio)
                  );

                  if (spread.isThirdLeg && !!thirdLeg) {
                    thirdLegSpread.thirdLeg = {
                        ...spread.thirdLeg,
                        positionsCount: thirdLegPositions!.find(p =>
                          p.ownedPortfolio.exchange === spread.thirdLeg.portfolio.exchange &&
                          p.ownedPortfolio.portfolio === spread.thirdLeg.portfolio.portfolio &&
                          p.targetInstrument.symbol === spread.thirdLeg.instrument.symbol
                        )?.qtyTFutureBatch ?? 0
                    };

                    buySpread = (buySpread).replace(
                      /L3/g,
                      this.escapeNegativeValues((spread.thirdLeg.side === Side.Buy ? thirdLeg.ask : thirdLeg.bid) * spread.thirdLeg.quantity * spread.thirdLeg.ratio)
                    );

                    sellSpread = sellSpread.replace(
                      /L3/g,
                      this.escapeNegativeValues((spread.thirdLeg.side === Side.Buy ? thirdLeg.bid : thirdLeg.ask) * spread.thirdLeg.quantity * spread.thirdLeg.ratio)
                    );
                  }

                  return {
                    ...spread,
                    firstLeg: {
                      ...spread.firstLeg,
                      positionsCount: firstLegPositions.find(p =>
                        p.ownedPortfolio.exchange === spread.firstLeg.portfolio.exchange &&
                        p.ownedPortfolio.portfolio === spread.firstLeg.portfolio.portfolio &&
                        p.targetInstrument.symbol === spread.firstLeg.instrument.symbol
                      )?.qtyTFutureBatch ?? 0
                    },
                    secondLeg: {
                      ...spread.secondLeg,
                      positionsCount: secondLegPositions.find(p =>
                        p.ownedPortfolio.exchange === spread.secondLeg.portfolio.exchange &&
                        p.ownedPortfolio.portfolio === spread.secondLeg.portfolio.portfolio &&
                        p.targetInstrument.symbol === spread.secondLeg.instrument.symbol
                      )?.qtyTFutureBatch ?? 0
                    },
                    ...thirdLegSpread,
                    buySpread: this.calculateExpression(buySpread),
                    sellSpread: this.calculateExpression(sellSpread)
                  };
                })
              );
          }));
        })
      );
  }

  addSpread(newSpread: ArbitrageSpread): void {
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

  editSpread(spread: ArbitrageSpread): void {
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

  removeSpread(spreadId: string): void {
    this.spreads$
      .pipe(take(1))
      .subscribe(spreads => {
        this.spreads$.next(spreads.filter(ext => ext.id !== spreadId));
      });
  }

  private saveSpreads(spreads: ArbitrageSpread[]): void {
    this.localStorage.setItem(this.spreadsKey, spreads);
  }

  buySpread(spread: ArbitrageSpread, volume = 1, side: Side = Side.Buy): Observable<OrderCommandResult | null> {
    return this.orderCommandService.submitMarketOrder(
      {
        instrument: spread.firstLeg.instrument,
        side: side,
        quantity: spread.firstLeg.quantity * volume
      },
      spread.firstLeg.portfolio.portfolio
    )
      .pipe(
        switchMap((order) => {
          if (!order.isSuccess) {
            return of(null);
          }

          return this.orderCommandService.submitMarketOrder(
            {
              instrument: spread.secondLeg.instrument,
              side: side === Side.Sell ? Side.Buy : Side.Sell,
              quantity: spread.secondLeg.quantity * volume
            },
            spread.secondLeg.portfolio.portfolio
          );
        }),
        switchMap((order: OrderCommandResult | null) => {
          if (!order) {
            return of(null);
          }

          if (!spread.isThirdLeg) {
            return of(order);
          }

          return this.orderCommandService.submitMarketOrder(
            {
              instrument: spread.thirdLeg.instrument,
              side: spread.thirdLeg.side === Side.Buy
                ? side
                : side === Side.Sell ? Side.Buy : Side.Sell,
              quantity: spread.thirdLeg.quantity * volume
            },
            spread.thirdLeg.portfolio.portfolio
          );
        })
      );
  }

  openSpreadModal(spread?: ArbitrageSpread | null): void {
    this.spreadParams.next(spread ?? null);
    this.shouldShowSpreadModal.next(true);
  }

  closeSpreadModal(): void {
    this.spreadParams.next(null);
    this.shouldShowSpreadModal.next(false);
  }

  private calculateExpression(expression: string): number | null {
    try {
      return window.eval(expression) as number;
    } catch {
      return null;
    }
  }

  private escapeNegativeValues(value: number): string {
    if(value < 0) {
      return `(${value})`;
    }

    return `${value}`;
  }
}
