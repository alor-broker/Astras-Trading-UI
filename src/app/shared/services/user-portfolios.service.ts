import { Injectable, inject } from '@angular/core';
import {filter, Observable, shareReplay} from "rxjs";
import {PortfolioExtended} from "../models/user/portfolio-extended.model";
import {Store} from "@ngrx/store";
import {EntityStatus} from "../models/enums/entity-status";
import {map} from "rxjs/operators";
import { PortfoliosFeature } from "../../store/portfolios/portfolios.reducer";

@Injectable({
  providedIn: 'root'
})
export class UserPortfoliosService {
  private readonly store = inject(Store);

  private allPortfolios: Observable<PortfolioExtended[]> | null = null;

  getPortfolios(): Observable<PortfolioExtended[]> {
    this.allPortfolios ??= this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
        filter(s => s.status === EntityStatus.Success),
        map(s => Object.values(s.entities).map(x => x!)),
        shareReplay(1)
      );

    return this.allPortfolios;
  }
}
