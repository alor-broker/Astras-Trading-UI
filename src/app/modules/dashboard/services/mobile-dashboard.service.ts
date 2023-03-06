import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { instrumentsHistory } from "../../../store/mobile-dashboard/mobile-dashboard.selectors";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { map, startWith } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MobileDashboardService {
  private dashboardTabSubject = new BehaviorSubject<string | null>(null);
  dashboardTab$ = this.dashboardTabSubject.asObservable();

  constructor(
    private readonly store: Store
  ) {
  }

  getInstrumentsHistory(): Observable<InstrumentKey[] | undefined> {
    return this.store.select(instrumentsHistory);
  }

  changeDashboardTab(tab: string) {
    this.dashboardTabSubject.next(tab);
  }

  getScreenHeight(): Observable<number> {
    return fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );
  }

}
