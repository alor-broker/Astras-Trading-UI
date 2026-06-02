import {
  firstValueFrom,
  of
} from 'rxjs';
import {WidgetBadgeHelper} from './widget-badge.helper';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';

describe('WidgetBadgeHelper', () => {
  const widgetGuid = 'widget-1';

  function createServices(
    widgetSettings: {linkToActive?: boolean, badgeColor?: string | null},
    terminalSettings: {badgesBind?: boolean}
  ): {
    widgetSettingsService: WidgetSettingsService;
    terminalSettingsService: TerminalSettingsService;
  } {
    return {
      widgetSettingsService: {
        getSettings: vi.fn().mockReturnValue(of(widgetSettings))
      } as unknown as WidgetSettingsService,
      terminalSettingsService: {
        getSettings: vi.fn().mockReturnValue(of(terminalSettings))
      } as unknown as TerminalSettingsService
    };
  }

  function showBadge(
    widgetSettings: {linkToActive?: boolean, badgeColor?: string | null},
    terminalSettings: {badgesBind?: boolean}
  ): Promise<boolean> {
    const {widgetSettingsService, terminalSettingsService} = createServices(widgetSettings, terminalSettings);

    return firstValueFrom(
      WidgetBadgeHelper.showBadge(widgetGuid, widgetSettingsService, terminalSettingsService)
    );
  }

  it('should show the badge when binding is on, the widget is linked and a color is set', async () => {
    expect(await showBadge({linkToActive: true, badgeColor: 'red'}, {badgesBind: true})).toBe(true);
  });

  it('should hide the badge when terminal binding is off', async () => {
    expect(await showBadge({linkToActive: true, badgeColor: 'red'}, {badgesBind: false})).toBe(false);
  });

  it('should hide the badge when no color is set', async () => {
    expect(await showBadge({linkToActive: true, badgeColor: null}, {badgesBind: true})).toBe(false);
  });

  it('should hide the badge when the widget is not linked to the active instrument', async () => {
    expect(await showBadge({linkToActive: false, badgeColor: 'red'}, {badgesBind: true})).toBe(false);
  });

  it('should treat a missing linkToActive flag as linked', async () => {
    expect(await showBadge({badgeColor: 'red'}, {badgesBind: true})).toBe(true);
  });

  it('should request settings for the requested widget guid', async () => {
    const {widgetSettingsService, terminalSettingsService} = createServices(
      {linkToActive: true, badgeColor: 'red'},
      {badgesBind: true}
    );

    await firstValueFrom(WidgetBadgeHelper.showBadge(widgetGuid, widgetSettingsService, terminalSettingsService));

    expect(widgetSettingsService.getSettings).toHaveBeenCalledWith(widgetGuid);
  });
});
