import {
  combineLatest,
  take
} from "rxjs";
import {PortfolioKey} from '../types/portfolio.types';
import {DesktopManageDashboardsService} from '../../features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {DashboardTemplatesService} from '../../features/dashboard/services/dashboard-templates.service';
import {ArrayHelper} from './array.helper';
import {AdminDashboardType} from '../../features/dashboard/types/dashboard.types';
import {DefaultDesktopDashboardConfig} from "../../features/dashboard/services/dashboard-templates-service.types";
import {GuidGenerator} from './guid-generator';

export class AdminDashboardsHelper {
  static openDashboardForPortfolio(
    selectedPortfolio: PortfolioKey,
    manageDashboardsService: DesktopManageDashboardsService,
    dashboardTemplatesService: DashboardTemplatesService): void {
    combineLatest({
      allDashboards: manageDashboardsService.allDashboards$,
      defaultConfigs: dashboardTemplatesService.getDashboardTemplatesConfig(),
    }).pipe(
      take(1)
    ).subscribe(x => {
      const dashboardTitle = `${selectedPortfolio.exchange} ${selectedPortfolio.portfolio}`;
      const existingDashboard = x.allDashboards.find(d => d.title === dashboardTitle);

      if (existingDashboard != null) {
        manageDashboardsService.selectDashboard(existingDashboard.guid);
        return;
      }

      const otherSelectedPortfolioDashboard = ArrayHelper.lastOrNull(x.allDashboards.filter(d => d.type === AdminDashboardType.AdminSelectedPortfolio));
      if (otherSelectedPortfolioDashboard != null) {
        manageDashboardsService.copyDashboard(
          otherSelectedPortfolioDashboard.guid,
          dashboardTitle,
          selectedPortfolio
        );
        return;
      }

      const standardConfig = x.defaultConfigs
        .filter((d) => d.type === AdminDashboardType.AdminSelectedPortfolio)
        .map((d) => d as DefaultDesktopDashboardConfig)[0];

      if (standardConfig == null) {
        return;
      }

      manageDashboardsService.addDashboardWithTemplate({
        title: dashboardTitle,
        items: standardConfig.widgets.map((w) => ({
          guid: GuidGenerator.newGuid(),
          widgetType: w.widgetTypeId,
          position: w.position,
          initialSettings: w.initialSettings,
        })),
        selectedPortfolio,
        isSelected: true,
        type: standardConfig.type,
        templateId: standardConfig.id
      });
    });
  }
}
