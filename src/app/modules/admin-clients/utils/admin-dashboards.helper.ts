import {combineLatest, take} from "rxjs";
import {PortfolioKey} from "../../../shared/models/portfolio-key.model";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {AdminDashboardType, DefaultDesktopDashboardConfig} from "../../../shared/models/dashboard/dashboard.model";
import {GuidGenerator} from "../../../shared/utils/guid";
import {ArrayHelper} from "../../../shared/utils/array-helper";

export class AdminDashboardsHelper {
  static openDashboardForPortfolio(
    selectedPortfolio: PortfolioKey,
    manageDashboardsService: ManageDashboardsService): void {
    combineLatest({
      allDashboards: manageDashboardsService.allDashboards$,
      defaultConfigs: manageDashboardsService.getDashboardTemplatesConfig(),
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
      if(otherSelectedPortfolioDashboard != null) {
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
