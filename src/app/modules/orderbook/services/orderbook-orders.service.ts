import { Injectable } from '@angular/core';
import { Subject } from "rxjs";
import { instrumentsBadges } from "../../../shared/utils/instruments";

@Injectable({
  providedIn: 'root'
})
export class OrderbookOrdersService {
  private selectedOrderPrice$ = new Subject<{ price: number, badgeColor: string }>();
  selectedOrderPrice = this.selectedOrderPrice$.asObservable();

  selectPrice(price: number, badgeColor: string) {
    if (price > 0 && instrumentsBadges.includes(badgeColor)) {
      this.selectedOrderPrice$.next({ price, badgeColor });
    }
  }
}
