import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap } from "rxjs";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ArbitrageRobot, RobotSpreadLeg, defaultRobotConfig } from "../models/arbitrage-robot.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { QuotesService } from "../../../shared/services/quotes.service";
import { Side } from "../../../shared/models/enums/side.model";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { OrderCommandResult } from "../../../shared/models/orders/new-order.model";
import { Quote } from "../../../shared/models/quotes/quote.model";
import { Position } from "../../../shared/models/positions/position.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

@Injectable()
export class ArbitrageRobotService {
  private readonly localStorage = inject(LocalStorageService);
  private readonly quotesService = inject(QuotesService);
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly spreadsKey = 'arbitrage-robot-spreads';
  private readonly spreads$ = new BehaviorSubject<ArbitrageRobot[]>([]);

  private readonly shouldShowModal = new BehaviorSubject<boolean>(false);
  private readonly modalParams = new BehaviorSubject<ArbitrageRobot | null>(null);
  shouldShowModal$ = this.shouldShowModal.asObservable();
  modalParams$ = this.modalParams.asObservable();

  getSpreadsSubscription(): Observable<ArbitrageRobot[]> {
    const stored = this.localStorage.getItem(this.spreadsKey) as ArbitrageRobot[] | undefined;

    if ((stored ?? []).length) {
      this.spreads$.next(stored!);
    }

    return this.spreads$.asObservable().pipe(
      tap(spreads => this.saveSpreads(spreads)),
      switchMap((spreads: ArbitrageRobot[]) => {
        if (!spreads.length) {
          return of([]);
        }

        return combineLatest(spreads.map(spread => {
          const requests: [
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

          return combineLatest(requests).pipe(
            map(([firstLeg, firstLegPos, secondLeg, secondLegPos, thirdLeg, thirdLegPos]) => {
              const thirdLegPatch: { thirdLeg?: RobotSpreadLeg } = {};

              let buySpread = (spread.calculationFormula ?? 'L1-L2')
                .replace(/L1/g, this.escape(firstLeg!.ask * spread.firstLeg.quantity * spread.firstLeg.ratio));

              buySpread = buySpread.replace(
                /L2/g,
                this.escape((spread.secondLeg.side === Side.Buy ? secondLeg!.ask : secondLeg!.bid) * spread.secondLeg.quantity * spread.secondLeg.ratio)
              );

              let sellSpread = (spread.calculationFormula ?? 'L1-L2')
                .replace(/L1/g, this.escape(firstLeg!.bid * spread.firstLeg.quantity * spread.firstLeg.ratio));

              sellSpread = sellSpread.replace(
                /L2/g,
                this.escape((spread.secondLeg.side === Side.Buy ? secondLeg!.bid : secondLeg!.ask) * spread.secondLeg.quantity * spread.secondLeg.ratio)
              );

              if (spread.isThirdLeg && !!thirdLeg) {
                thirdLegPatch.thirdLeg = {
                  ...spread.thirdLeg,
                  positionsCount: thirdLegPos!.find(p =>
                    p.ownedPortfolio.exchange === spread.thirdLeg.portfolio.exchange &&
                    p.ownedPortfolio.portfolio === spread.thirdLeg.portfolio.portfolio &&
                    p.targetInstrument.symbol === spread.thirdLeg.instrument.symbol
                  )?.qtyTFutureBatch ?? 0
                };

                buySpread = buySpread.replace(
                  /L3/g,
                  this.escape((spread.thirdLeg.side === Side.Buy ? thirdLeg.ask : thirdLeg.bid) * spread.thirdLeg.quantity * spread.thirdLeg.ratio)
                );

                sellSpread = sellSpread.replace(
                  /L3/g,
                  this.escape((spread.thirdLeg.side === Side.Buy ? thirdLeg.bid : thirdLeg.ask) * spread.thirdLeg.quantity * spread.thirdLeg.ratio)
                );
              }

              return {
                ...spread,
                firstLeg: {
                  ...spread.firstLeg,
                  positionsCount: firstLegPos.find(p =>
                    p.ownedPortfolio.exchange === spread.firstLeg.portfolio.exchange &&
                    p.ownedPortfolio.portfolio === spread.firstLeg.portfolio.portfolio &&
                    p.targetInstrument.symbol === spread.firstLeg.instrument.symbol
                  )?.qtyTFutureBatch ?? 0
                },
                secondLeg: {
                  ...spread.secondLeg,
                  positionsCount: secondLegPos.find(p =>
                    p.ownedPortfolio.exchange === spread.secondLeg.portfolio.exchange &&
                    p.ownedPortfolio.portfolio === spread.secondLeg.portfolio.portfolio &&
                    p.targetInstrument.symbol === spread.secondLeg.instrument.symbol
                  )?.qtyTFutureBatch ?? 0
                },
                ...thirdLegPatch,
                buySpread: this.evalExpr(buySpread),
                sellSpread: this.evalExpr(sellSpread)
              };
            })
          );
        }));
      })
    );
  }

  addSpread(spread: ArbitrageRobot): void {
    this.spreads$.pipe(take(1)).subscribe(spreads => {
      this.spreads$.next([
        { ...spread, id: GuidGenerator.newGuid(), robotConfig: spread.robotConfig ?? defaultRobotConfig() },
        ...spreads
      ]);
    });
  }

  editSpread(spread: ArbitrageRobot): void {
    this.spreads$.pipe(take(1)).subscribe(spreads => {
      this.spreads$.next(spreads.map(s => s.id !== spread.id ? s : { ...s, ...spread }));
    });
  }

  updateRobotConfig(spreadId: string, patch: Partial<ArbitrageRobot['robotConfig']>): void {
    this.spreads$.pipe(take(1)).subscribe(spreads => {
      this.spreads$.next(spreads.map(s =>
        s.id !== spreadId ? s : { ...s, robotConfig: { ...s.robotConfig, ...patch } }
      ));
    });
  }

  removeSpread(spreadId: string): void {
    this.spreads$.pipe(take(1)).subscribe(spreads => {
      this.spreads$.next(spreads.filter(s => s.id !== spreadId));
    });
  }

  buySpread(spread: ArbitrageRobot, volume: number, side: Side = Side.Buy): Observable<OrderCommandResult | null> {
    return this.orderCommandService.submitMarketOrder(
      { instrument: spread.firstLeg.instrument, side, quantity: spread.firstLeg.quantity * volume },
      spread.firstLeg.portfolio.portfolio
    ).pipe(
      switchMap(order => {
        if (!order.isSuccess) return of(null);
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
        if (!order || !spread.isThirdLeg) return of(order);
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

  hasOpenPositions(spread: ArbitrageRobot): boolean {
    const legs = [spread.firstLeg, spread.secondLeg];
    if (spread.isThirdLeg) legs.push(spread.thirdLeg);
    return legs.some(leg => leg.positionsCount != null && leg.positionsCount !== 0);
  }

  getOpenPositionNames(spread: ArbitrageRobot): string {
    const legs = [spread.firstLeg, spread.secondLeg];
    if (spread.isThirdLeg) legs.push(spread.thirdLeg);
    return legs
      .filter(leg => leg.positionsCount != null && leg.positionsCount !== 0)
      .map(leg => `${leg.instrument.symbol} (${leg.positionsCount! > 0 ? '+' : ''}${leg.positionsCount})`)
      .join(', ');
  }

  closePositions(spread: ArbitrageRobot, volume?: number): Observable<OrderCommandResult | null> {
    const legs = [spread.firstLeg, spread.secondLeg];
    if (spread.isThirdLeg) legs.push(spread.thirdLeg);

    const openLegs = legs.filter(leg => leg.positionsCount != null && leg.positionsCount !== 0);
    if (!openLegs.length) return of(null);

    return openLegs.reduce(
      (chain$: Observable<OrderCommandResult | null>, leg) => chain$.pipe(
        switchMap(() => {
          const closeQty = volume != null
            ? Math.min(volume * leg.quantity, Math.abs(leg.positionsCount!))
            : Math.abs(leg.positionsCount!);

          return this.orderCommandService.submitMarketOrder(
            {
              instrument: leg.instrument,
              side: leg.positionsCount! > 0 ? Side.Sell : Side.Buy,
              quantity: closeQty
            },
            leg.portfolio.portfolio
          );
        })
      ),
      of(null)
    );
  }

  openModal(spread?: ArbitrageRobot | null): void {
    this.modalParams.next(spread ?? null);
    this.shouldShowModal.next(true);
  }

  closeModal(): void {
    this.modalParams.next(null);
    this.shouldShowModal.next(false);
  }

  private saveSpreads(spreads: ArbitrageRobot[]): void {
    this.localStorage.setItem(this.spreadsKey, spreads);
  }

  private evalExpr(expr: string): number | null {
    try {
      return window.eval(expr) as number;
    } catch {
      return null;
    }
  }

  private escape(value: number): string {
    return value < 0 ? `(${value})` : `${value}`;
  }
}
