import { Injectable, inject } from '@angular/core';
import {
  distinctUntilChanged,
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
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { DeviceService } from "./device.service";
import { MobileDashboardStreams } from "../../store/mobile-dashboard/mobile-dashboard.streams";
import { mapWith } from "../utils/observable-helper";
import { isPortfoliosEqual } from "../utils/portfolios";
import { DashboardsCurrentSelectionActions } from "../../store/dashboards/dashboards-actions";
import { MobileDashboardCurrentSelectionActions } from "../../store/mobile-dashboard/mobile-dashboard-actions";

@Injectable({
  providedIn: 'root'
})
export class DashboardContextService {
  private readonly store = inject(Store);
  private readonly deviceService = inject(DeviceService);

  get selectedPortfolio$(): Observable<PortfolioKey> {
    return this.selectedPortfolioOrNull$.pipe(
      filter((p): p is PortfolioKey => !!p)
    );
  }

  get selectedPortfolioOrNull$(): Observable<PortfolioKey | null> {
    return this.selectedDashboard$.pipe(
      map(d => d.selectedPortfolio ?? null),
      distinctUntilChanged((prev, curr) => isPortfoliosEqual(prev, curr))
    );
  }

  get instrumentsSelection$(): Observable<InstrumentGroups> {
    return this.selectedDashboard$.pipe(
      map(d => d.instrumentsSelection),
      filter((g): g is InstrumentGroups => !!g)
    );
  }

  selectDashboardPortfolio(portfolioKey: PortfolioKey): void {
    this.selectedDashboard$.pipe(
      mapWith(
        () => this.deviceService.deviceInfo$,
        (dashboard, deviceInfo) => ({ dashboard, isMobile: deviceInfo.isMobile })
      ),
      take(1)
    ).subscribe(({ dashboard, isMobile }) => {
      if (isMobile) {
        this.store.dispatch(MobileDashboardCurrentSelectionActions.selectPortfolio({ portfolioKey }));
      } else {
        this.store.dispatch(DashboardsCurrentSelectionActions.selectPortfolio({ dashboardGuid: dashboard.guid, portfolioKey }));
      }
    });
  }

  selectDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.selectedDashboard$.pipe(
      mapWith(
        () => this.deviceService.deviceInfo$,
        (dashboard, deviceInfo) => ({ dashboard, isMobile: deviceInfo.isMobile })
      ),
      take(1)
    ).subscribe(({ dashboard, isMobile }) => {
      if (isMobile) {
        this.store.dispatch(MobileDashboardCurrentSelectionActions.selectInstrument({
          selection: { groupKey, instrumentKey }
        }));
      } else {
        this.store.dispatch(DashboardsCurrentSelectionActions.selectInstruments({
          dashboardGuid: dashboard.guid,
          selection: [{ groupKey, instrumentKey }]
        }));
      }
    });
  }

  get selectedDashboard$(): Observable<Dashboard> {
    return this.deviceService.deviceInfo$
      .pipe(
        switchMap(({ isMobile }) => isMobile
          ? MobileDashboardStreams.getMobileDashboard(this.store)
          : DashboardsStreams.getSelectedDashboard(this.store))
      );
  }
}
