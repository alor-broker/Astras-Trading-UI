import {Injectable} from '@angular/core';
import {filter, Observable, shareReplay} from "rxjs";
import {PortfolioExtended} from "../models/user/portfolio-extended.model";
import {Store} from "@ngrx/store";
import {selectPortfoliosState} from "../../store/portfolios/portfolios.selectors";
import {EntityStatus} from "../models/enums/entity-status";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UserPortfoliosService {
  private allPortfolios: Observable<PortfolioExtended[]> | null = null;

  constructor(private readonly store: Store) {
  }

  getPortfolios(): Observable<PortfolioExtended[]> {
    if(!this.allPortfolios) {
      this.allPortfolios = this.store.select(selectPortfoliosState).pipe(
        filter(s => s.status === EntityStatus.Success),
        map(s => Object.values(s.entities).map(x => x!)),
        shareReplay(1)
      );
    }

    return this.allPortfolios;
  }
}
