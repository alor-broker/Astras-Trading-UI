import {Store} from "@ngrx/store";
import {filter, Observable} from "rxjs";
import {WidgetSettings} from "../../shared/models/widget-settings.model";
import {
  selectWidgetSettingsState
} from "./widget-settings.selectors";
import {EntityStatus} from "../../shared/models/enums/entity-status";
import {distinct, map} from "rxjs/operators";
import {State} from "./widget-settings.reducer";
import {isInstrumentDependent, isPortfolioDependent} from "../../shared/utils/settings-helper";

export class WidgetSettingsStreams {
  static getAllSettings(store: Store): Observable<WidgetSettings[]> {
    return this.getState(store).pipe(
      filter(state => state.status === EntityStatus.Success),
      map(state => state.ids.map(id => state.entities[id]!))
    );
  }

  static getSettingsOrNull(store: Store, guid: string): Observable<WidgetSettings | null> {
    return this.getState(store).pipe(
      map(state => state.entities[guid] ?? null),
      distinct()
    );
  }

  static getInstrumentLinkedSettings(store: Store): Observable<WidgetSettings[]> {
    return this.getAllSettings(store).pipe(
      map(settings => settings.filter(s => (s.linkToActive ?? false) && isInstrumentDependent(s)))
    );
  }

  static getPortfolioLinkedSettings(store: Store): Observable<WidgetSettings[]> {
    return this.getAllSettings(store).pipe(
      map(settings => settings.filter(s => (s.linkToActive ?? false) && isPortfolioDependent(s)))
    );
  }

  private static getState(store: Store): Observable<State> {
    return store.select(selectWidgetSettingsState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
