import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {
  filter,
  switchMap,
  take
} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {DashboardContextService} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';

export class WidgetSettingsFactoryHelper {
  static createWidgetSettingsIfMissing<T extends WidgetSettings>(
    widgetInstance: WidgetInstance,
    settingsType: string,
    fill: (settings: T) => T,
    widgetSettingsService: WidgetSettingsService): void {
    widgetSettingsService.getSettingsOrNull(widgetInstance.instance.guid).pipe(
      take(1),
      filter(x => !x)
    ).subscribe(() => {
      const settings = {
        ...widgetInstance.widgetMeta.baseSettings,
        guid: widgetInstance.instance.guid,
        settingsType,
        ...widgetInstance.instance.initialSettings
      } as T;

      widgetSettingsService.addSettings([fill(settings)]);
    });
  }

  static createInstrumentLinkedWidgetSettingsIfMissing<T extends WidgetSettings & InstrumentKey>(
    widgetInstance: WidgetInstance,
    settingsType: string,
    fill: (settings: T) => T,
    dashboardContextService: DashboardContextService,
    widgetSettingsService: WidgetSettingsService
  ): void {
    widgetSettingsService.getSettingsOrNull(widgetInstance.instance.guid).pipe(
      take(1),
      filter(x => !x),
      switchMap(() => dashboardContextService.instrumentsSelection$),
      take(1)
    ).subscribe(instrumentSelection => {
      const groupKey = DefaultBadge;
      const settings = {
        ...widgetInstance.widgetMeta.baseSettings,
        guid: widgetInstance.instance.guid,
        settingsType,
        linkToActive: true,
        ...InstrumentKeyHelper.toInstrumentKey(instrumentSelection[groupKey]!),
        badgeColor: groupKey,
        ...widgetInstance.instance.initialSettings
      } as T;

      widgetSettingsService.addSettings([fill(settings)]);
    });
  }

  static createPortfolioLinkedWidgetSettingsIfMissing<T extends WidgetSettings & PortfolioKey>(
    widgetInstance: WidgetInstance,
    settingsType: string,
    fill: (settings: T) => T,
    dashboardContextService: DashboardContextService,
    widgetSettingsService: WidgetSettingsService
  ): void {
    widgetSettingsService.getSettingsOrNull(widgetInstance.instance.guid).pipe(
      take(1),
      filter(x => !x),
      switchMap(() => dashboardContextService.selectedPortfolio$),
      take(1)
    ).subscribe(portfolio => {
      const settings = {
        ...widgetInstance.widgetMeta.baseSettings,
        guid: widgetInstance.instance.guid,
        settingsType,
        linkToActive: true,
        ...portfolio,
        ...widgetInstance.instance.initialSettings
      } as T;

      widgetSettingsService.addSettings([fill(settings)]);
    });
  }
}
