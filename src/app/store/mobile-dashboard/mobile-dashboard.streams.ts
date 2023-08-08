import {Observable} from 'rxjs';
import {Dashboard} from '../../shared/models/dashboard/dashboard.model';
import {Store} from '@ngrx/store';
import {selectMobileDashboardsState} from './mobile-dashboard.selectors';
import {filter, map} from 'rxjs/operators';
import {EntityStatus} from "../../shared/models/enums/entity-status";
import {State} from "./mobile-dashboard.reducer";

export class MobileDashboardStreams {
  static getMobileDashboard(store: Store): Observable<Dashboard> {
    return this.getState(store).pipe(
      map(x => x.dashboard),
      filter((x): x is Dashboard => !!x)
    );
  }

  private static getState(store: Store): Observable<State> {
    return store.select(selectMobileDashboardsState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
