import { Injectable } from '@angular/core';
import {
  filter,
  Observable, switchMap,
  take
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  Dashboard,
  InstrumentGroups
} from '../models/dashboard/dashboard.model';
import { DashboardsStreams } from '../../store/dashboards/dashboards.streams';
import { PortfolioKey } from '../models/portfolio-key.model';
import { map } from 'rxjs/operators';
import { CurrentDashboardActions } from '../../store/dashboards/dashboards-actions';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { DeviceService } from "./device.service";
import { mobileDashboard } from "../../store/mobile-dashboard/dashboards.selectors";
import { MobileDashboardActions } from "../../store/mobile-dashboard/dashboards-actions";

@Injectable({
  providedIn: 'root'
})
export class DashboardContextService {
  constructor(
    private readonly store: Store,
    private readonly deviceService: DeviceService,
  ) {
  }

  get selectedPortfolio$(): Observable<PortfolioKey> {
    return this.selectedDashboard$.pipe(
      map(d => d.selectedPortfolio),
      filter((p): p is PortfolioKey => !!p)
    );
  }

  get instrumentsSelection$(): Observable<InstrumentGroups> {
    return this.selectedDashboard$.pipe(
      map(d => d.instrumentsSelection),
      filter((g): g is InstrumentGroups => !!g)
    );
  }

  selectDashboardPortfolio(portfolioKey: PortfolioKey) {
    this.selectedDashboard$.pipe(
      take(1)
    ).subscribe(dashboard => {
      this.store.dispatch(CurrentDashboardActions.selectPortfolio({ dashboardGuid: dashboard.guid, portfolioKey }));
    });
  }

  selectDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string) {
    this.selectedDashboard$.pipe(
      take(1)
    ).subscribe(dashboard => {
      this.store.dispatch(CurrentDashboardActions.selectInstruments({
        dashboardGuid: dashboard.guid,
        selection: [{ groupKey, instrumentKey }]
      }));
    });
  }

  selectMobileDashboardPortfolio(portfolioKey: PortfolioKey) {
    this.store.dispatch(MobileDashboardActions.selectPortfolio({ portfolioKey }));
  }

  selectMobileDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string) {
    this.store.dispatch(MobileDashboardActions.selectInstruments({
      selection: [{ groupKey, instrumentKey }]
    }));
  }

  get selectedDashboard$(): Observable<Dashboard> {
    return this.deviceService.deviceInfo$
      .pipe(
        switchMap(({ isMobile }) => isMobile
          ? this.store.select(mobileDashboard)
            .pipe(
              filter(d => !!d)
            )
          : DashboardsStreams.getSelectedDashboard(this.store))
      );
  }
}
