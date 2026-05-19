import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {DashboardsFeature} from './store/reducer';
import {DashboardsEffects} from './store/effects';
import {DashboardsBridgeEffects} from './store/bridge-effects';
import {DesktopDashboardContextService} from './services/desktop-dashboard-context.service';
import {DesktopManageDashboardsService} from './services/desktop-manage-dashboards.service';
import {DashboardTemplatesService} from '../services/dashboard-templates.service';
import {DASHBOARD_CONTEXT_SERVICE} from '../services/dashboard-context-service.types';

export function provideDesktopDashboardsStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(DashboardsFeature),
    provideEffects([
      DashboardsEffects,
      DashboardsBridgeEffects
    ]),
    DesktopDashboardContextService,
    {
      provide: DASHBOARD_CONTEXT_SERVICE,
      useExisting: DesktopDashboardContextService
    },
    DesktopManageDashboardsService,
    DashboardTemplatesService
  ]);
}
