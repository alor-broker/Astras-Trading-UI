import {Dashboard} from '../types/dashboard.types';
import {TranslatorFn} from '../../translations/services/translator-service.types';

export class DashboardTitleHelper {
  static getDisplayTitle(dashboard: Dashboard, translator: TranslatorFn): string {
    const defaultTitles = [
      'Default Dashboard',
      'Home',
      'Trading',
      'Lite Dashboard',
      'All Clients'
    ];

    for (const defaultTitle of defaultTitles) {
      if (dashboard.title.startsWith(defaultTitle)) {
        return dashboard.title.replace(defaultTitle, translator(['defaultDashboardNames', defaultTitle], {fallback: defaultTitle}));
      }
    }

    return dashboard.title;
  }
}
