import { Observable } from 'rxjs';
import { Dashboard } from '../../shared/models/dashboard/dashboard.model';
import { Store } from '@ngrx/store';
import { mobileDashboard } from './mobile-dashboard.selectors';
import { filter } from 'rxjs/operators';

export class MobileDashboardStreams {
  static getMobileDashboard(store: Store): Observable<Dashboard> {
    return store.select(mobileDashboard).pipe(
      filter((x): x is Dashboard => !!x)
    );
  }
}
