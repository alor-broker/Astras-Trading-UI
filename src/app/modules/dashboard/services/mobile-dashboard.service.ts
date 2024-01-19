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

  addWidget(widgetType: string, initialSettings?: { [propName: string]: any }): void {
    this.store.dispatch(MobileDashboardItemsActions.addWidgets(
      {
        widgets: [{
          widgetType: widgetType,
          initialSettings: initialSettings
        }]
      }));
  }

  removeWidgets(widgetIds: string[]): void {
    this.store.dispatch(MobileDashboardItemsActions.removeWidgets({
        widgetIds
      }));
  }
}
