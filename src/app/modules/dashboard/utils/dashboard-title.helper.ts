﻿import { Dashboard } from "../../../shared/models/dashboard/dashboard.model";
import { TranslatorFn } from "../../../shared/services/translator.service";

export class DashboardTitleHelper {
  static getDisplayTitle(dashboard: Dashboard, translator: TranslatorFn): string {
    const defaultTitles = [
      'Default Dashboard',
      'Lite Dashboard'
    ];

    for (let defaultTitle of defaultTitles) {
      if (dashboard.title.startsWith(defaultTitle)) {
        return dashboard.title.replace(defaultTitle, translator(['defaultDashboardNames', defaultTitle], { fallback: defaultTitle }));
      }
    }

    return dashboard.title;
  }
}
