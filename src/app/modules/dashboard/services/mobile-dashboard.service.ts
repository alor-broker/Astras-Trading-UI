import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class MobileDashboardService {
  private instrumentsSubject = new BehaviorSubject<InstrumentKey[]>([]);
  instruments$ = this.instrumentsSubject.asObservable();

  private dashboardTabSubject = new BehaviorSubject<string | null>(null);
  dashboardTab$ = this.dashboardTabSubject.asObservable();

  addToHistory(instrument: InstrumentKey) {
    this.instrumentsSubject.next([instrument, ...this.instrumentsSubject.getValue()].slice(0, 3));
  }

  changeDashboardTab(tab: string) {
    this.dashboardTabSubject.next(tab);
  }

}
