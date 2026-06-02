import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {provideState} from '@ngrx/store';
import {MobileDashboardFeature} from './store/reducer';
import {MobileDashboardEffects} from './store/effects';
import {MobileDashboardContextService} from './services/mobile-dashboard-context.service';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {DashboardTemplatesService} from '@terminal-core-lib/features/dashboard/services/dashboard-templates.service';
import {provideEffects} from '@ngrx/effects';
import {MobileDashboardManageService} from './services/mobile-dashboard-manage.service';

export function provideMobileDashboardStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(MobileDashboardFeature),
    provideEffects([MobileDashboardEffects]),
    MobileDashboardContextService,
    {
      provide: DASHBOARD_CONTEXT_SERVICE,
      useExisting: MobileDashboardContextService
    },
    DashboardTemplatesService,
    MobileDashboardManageService
  ]);
}
