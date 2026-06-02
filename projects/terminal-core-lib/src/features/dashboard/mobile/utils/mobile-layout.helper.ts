import {QuickAccessPanelWidget} from '../../../terminal-settings/terminal-settings.types';
import {DashboardTemplatesService} from '../../services/dashboard-templates.service';
import {
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap
} from 'rxjs';
import {
  DefaultMobileDashboardConfig,
  QuickAccessPanelItem
} from '../../services/dashboard-templates-service.types';
import {TerminalSettingsService} from '../../../terminal-settings/services/terminal-settings.service';
import {ClientDashboardType} from '../../types/dashboard.types';

export class MobileLayoutHelper {
  static getDefaultQuickAccessPanelWidgets(dashboardTemplatesService: DashboardTemplatesService): Observable<QuickAccessPanelItem[]> {
    return dashboardTemplatesService.getDashboardTemplatesConfig().pipe(
      map(c => {
        const mobileConfig = c.find(i => i.type === ClientDashboardType.ClientMobile) as DefaultMobileDashboardConfig | undefined;

        if (mobileConfig == null) {
          return null;
        }

        return mobileConfig.quickAccessPanelItems;
      }),
      filter(x => x != null),
      shareReplay(1)
    );
  }

  static getQuickAccessPanelWidgets(
    terminalSettingsService: TerminalSettingsService,
    dashboardTemplatesService: DashboardTemplatesService
  ): Observable<QuickAccessPanelWidget[]> {
    return terminalSettingsService.getSettings().pipe(
      switchMap(s => {
        if (s.mobileDashboardLayout != null) {
          return of(s.mobileDashboardLayout.quickAccessPanelWidgets);
        }

        return this.getDefaultQuickAccessPanelWidgets(dashboardTemplatesService);
      }),
      shareReplay(1)
    );
  }
}
