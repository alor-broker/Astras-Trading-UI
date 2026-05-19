import {
  map,
  Observable
} from 'rxjs';
import {Dashboard,} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {MobileDashboardStreams} from '../store/streams';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardEventsActions,
  MobileDashboardInternalActions
} from '../store/actions';
import {
  Actions,
  ofType
} from '@ngrx/effects';
import {
  inject,
  Injectable
} from '@angular/core';

@Injectable()
export class MobileDashboardContextService extends DesktopDashboardContextService {
  private readonly actions$ = inject(Actions);

  override selectDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.store.dispatch(MobileDashboardCurrentSelectionActions.selectInstrument({
      selection: {groupKey, instrumentKey}
    }));
  }

  override selectDashboardPortfolio(portfolioKey: PortfolioKey): void {
    this.store.dispatch(MobileDashboardCurrentSelectionActions.selectPortfolio({portfolioKey}));
  }

  init(mobileDashboard: Dashboard | null, instrumentsHistory: InstrumentKey[]): void {
    this.store.dispatch(MobileDashboardInternalActions.init({
      mobileDashboard,
      instrumentsHistory
    }));
  }

  onUpdated(): Observable<Dashboard> {
    return this.actions$.pipe(
      ofType(MobileDashboardEventsActions.updated),
      map(a => a.dashboard)
    );
  }

  onInstrumentHistoryUpdated(): Observable<InstrumentKey[]> {
    return this.actions$.pipe(
      ofType(MobileDashboardEventsActions.instrumentsHistoryUpdated),
      map(a => a.instruments)
    );
  }

  protected override getSelectedDashboardInternal(): Observable<Dashboard> {
    return MobileDashboardStreams.getMobileDashboard(this.store);
  }
}
