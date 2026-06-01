import {
  distinctUntilChanged,
  filter,
  map,
  Observable,
  take
} from 'rxjs';
import {
  Dashboard,
  InstrumentGroups
} from '../../types/dashboard.types';
import {InstrumentKey} from '../../../../common/types/instrument.types';
import {PortfolioKey} from '../../../../common/types/portfolio.types';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {DashboardsCurrentSelectionActions} from '../store/actions';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {DashboardsStreams} from '@terminal-core-lib/features/dashboard/desktop/store/streams';
import {DashboardContextService} from '../../services/dashboard-context-service.types';

export class DesktopDashboardContextService implements DashboardContextService {
  protected readonly store = inject(Store);

  get instrumentsSelection$(): Observable<InstrumentGroups> {
    return this.selectedDashboard$.pipe(
      map(d => d.instrumentsSelection),
      filter((g): g is InstrumentGroups => !!g)
    );
  }

  get selectedDashboard$(): Observable<Dashboard> {
    return this.getSelectedDashboardInternal();
  }

  get selectedPortfolio$(): Observable<PortfolioKey> {
    return this.selectedPortfolioOrNull$.pipe(
      filter((p): p is PortfolioKey => !!p)
    );
  }

  get selectedPortfolioOrNull$(): Observable<PortfolioKey | null> {
    return this.selectedDashboard$.pipe(
      map(d => d.selectedPortfolio ?? null),
      distinctUntilChanged((prev, curr) => PortfolioKeyEqualityComparer.equals(prev, curr))
    );
  }

  selectDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.selectedDashboard$.pipe(
      take(1)
    ).subscribe(dashboard => {
      this.store.dispatch(DashboardsCurrentSelectionActions.selectInstruments({
        dashboardGuid: dashboard.guid,
        selection: [{groupKey, instrumentKey}]
      }));
    });
  }

  selectDashboardPortfolio(portfolioKey: PortfolioKey): void {
    this.selectedDashboard$.pipe(
      take(1)
    ).subscribe(dashboard => {
      this.store.dispatch(DashboardsCurrentSelectionActions.selectPortfolio({
        dashboardGuid: dashboard.guid,
        portfolioKey
      }));
    });
  }

  protected getSelectedDashboardInternal(): Observable<Dashboard> {
    return DashboardsStreams.getSelectedDashboard(this.store);
  }
}
