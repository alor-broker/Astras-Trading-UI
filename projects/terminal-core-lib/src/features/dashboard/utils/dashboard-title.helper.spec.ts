import {DashboardTitleHelper} from './dashboard-title.helper';
import {Dashboard} from '../types/dashboard.types';
import {TranslatorFn} from '../../translations/services/translator-service.types';

describe('DashboardTitleHelper', () => {
  function createDashboard(title: string): Dashboard {
    return {guid: 'guid-1', title, version: '1', items: []} as unknown as Dashboard;
  }

  describe('getDisplayTitle', () => {
    it('should translate a known default dashboard title', () => {
      const translator: TranslatorFn = vi.fn(key => `[${key[1]}]`);

      const result = DashboardTitleHelper.getDisplayTitle(createDashboard('Home'), translator);

      expect(result).toBe('[Home]');
      expect(translator).toHaveBeenCalledWith(['defaultDashboardNames', 'Home'], {fallback: 'Home'});
    });

    it('should translate only the default prefix and keep the remainder', () => {
      const translator: TranslatorFn = vi.fn(key => `[${key[1]}]`);

      const result = DashboardTitleHelper.getDisplayTitle(createDashboard('Trading 2'), translator);

      expect(result).toBe('[Trading] 2');
    });

    it('should return a custom title unchanged without invoking the translator', () => {
      const translator: TranslatorFn = vi.fn(key => `[${key[1]}]`);

      const result = DashboardTitleHelper.getDisplayTitle(createDashboard('My Board'), translator);

      expect(result).toBe('My Board');
      expect(translator).not.toHaveBeenCalled();
    });
  });
});
