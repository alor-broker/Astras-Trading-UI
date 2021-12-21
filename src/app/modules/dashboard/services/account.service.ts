import { Injectable } from '@angular/core';
import { distinct, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PortfolioKey } from '../models/portfolio-key.model';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { findUnique } from 'src/app/shared/utils/collections';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

constructor(private authService: AuthService, private positionsService: PositionsService) { }

getActivePortfolios() : Observable<PortfolioKey[]> {
  return this.authService.currentUser$.pipe(
    map(u => u.login),
    distinct(),
    switchMap(login => this.positionsService.getAllByLogin(login)),
    map(positions => {
      return findUnique(positions, (pos) : PortfolioKey =>
        ({ portfolio: pos.portfolio, exchange: pos.exchange })
      );
    })
  )
}

}
