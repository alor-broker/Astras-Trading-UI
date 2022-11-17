import { WidgetNames } from '../models/enums/widget-names';
import { DashboardService } from '../services/dashboard.service';

export class DashboardHelper {
  static addWidget(dashboardService: DashboardService, widgetName: string | WidgetNames, additionalSettings?: any) {
    dashboardService.addWidget({
        gridItem: {
          x: 0,
          y: 0,
          cols: 10,
          rows: 18,
          type: widgetName
        },
      },
      additionalSettings);
  }
}
