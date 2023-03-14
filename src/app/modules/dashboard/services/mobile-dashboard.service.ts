import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { instrumentsHistory } from "../../../store/mobile-dashboard/mobile-dashboard.selectors";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class MobileDashboardService {

  constructor(
    private readonly store: Store
  ) {
  }

  getInstrumentsHistory(): Observable<InstrumentKey[] | undefined> {
    return this.store.select(instrumentsHistory);
  }
}
