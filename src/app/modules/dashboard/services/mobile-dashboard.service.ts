import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { MobileDashboardFeature } from "../../../store/mobile-dashboard/mobile-dashboard.reducer";
import { MobileDashboardItemsActions } from "../../../store/mobile-dashboard/mobile-dashboard-actions";

@Injectable({
  providedIn: 'root'
})
export class MobileDashboardService {
  constructor(
    private readonly store: Store
  ) {
  }

  getInstrumentsHistory(): Observable<InstrumentKey[] | undefined> {
    return this.store.select(MobileDashboardFeature.instrumentsHistory);
  }

  addWidget(widgetType: string): void {
    this.store.dispatch(MobileDashboardItemsActions.addWidget(
      {
        widget: {
          widgetType: widgetType
        }
      }));
  }
}
