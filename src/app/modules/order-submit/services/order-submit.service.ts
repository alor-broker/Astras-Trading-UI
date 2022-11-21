import { Injectable } from '@angular/core';
import { filter, Observable } from "rxjs";
import { Position } from "../../../shared/models/positions/position.model";
import { map, startWith } from "rxjs/operators";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";

interface InstrumentWithPortfolio {
  instrument: Instrument,
  portfolio: string
}

@Injectable({
  providedIn: 'root'
})
export class OrderSubmitService {

  constructor(
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
  ) {}

  public getPosition(instrumentInfo: InstrumentWithPortfolio): Observable<Position | null> {
    return this.portfolioSubscriptionsService.getAllPositionsSubscription(instrumentInfo.portfolio, instrumentInfo.instrument.exchange)
      .pipe(
        map(x => x.find(p => p.symbol === instrumentInfo.instrument.symbol && p.exchange === instrumentInfo.instrument.exchange)),
        filter((p): p is Position => !!p),
        map(p => (!p || !p.avgPrice ? null as any : p)),
        startWith(null)
      );
  }
}
