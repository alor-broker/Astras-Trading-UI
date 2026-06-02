import {Observable} from 'rxjs';
import {
  Dashboard,
  InstrumentGroups
} from '../types/dashboard.types';
import {InjectionToken} from '@angular/core';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';

export interface DashboardContextService {
  get selectedDashboard$(): Observable<Dashboard>;

  get selectedPortfolio$(): Observable<PortfolioKey>;

  get selectedPortfolioOrNull$(): Observable<PortfolioKey | null>;

  get instrumentsSelection$(): Observable<InstrumentGroups>;

  selectDashboardPortfolio(portfolioKey: PortfolioKey): void;

  selectDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string): void;
}

export const DASHBOARD_CONTEXT_SERVICE = new InjectionToken<DashboardContextService>('DashboardContextService');
