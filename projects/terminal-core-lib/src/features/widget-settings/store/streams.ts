import {Store} from '@ngrx/store';
import {
  filter,
  map,
  Observable
} from 'rxjs';
import {distinct} from 'rxjs/operators';
import {WidgetSettings} from '../widget-settings.types';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {
  State,
  WidgetSettingsFeature
} from './reducer';
import {WidgetSettingsHelper} from '../utils/widget-settings.helper';

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
      map(settings => settings.filter(s => (s.linkToActive ?? false) && WidgetSettingsHelper.isInstrumentDependent(s)))
    );
  }

  static getPortfolioLinkedSettings(store: Store): Observable<WidgetSettings[]> {
    return this.getAllSettings(store).pipe(
      map(settings => settings.filter(s => (s.linkToActive ?? false) && WidgetSettingsHelper.isPortfolioDependent(s)))
    );
  }

  static getState(store: Store): Observable<State> {
    return store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
