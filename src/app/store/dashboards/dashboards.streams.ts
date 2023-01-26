import { Observable } from 'rxjs';
import { Dashboard } from '../../shared/models/dashboard/dashboard.model';
import { Store } from '@ngrx/store';
import { selectedDashboard } from './dashboards.selectors';
import { filter } from 'rxjs/operators';

export class DashboardsStreams {
  static getSelectedDashboard(store: Store): Observable<Dashboard> {
    return store.select(selectedDashboard).pipe(
      filter((x): x is Dashboard => !!x)
    );
  }
}
