import { WidgetSettingsService } from '../../services/widget-settings.service';
import { WidgetSettings } from '../../models/widget-settings.model';
import {
  switchMap,
  take
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardContextService } from '../../services/dashboard-context.service';
import {
  defaultBadgeColor,
  toInstrumentKey
} from '../instruments';
import { InstrumentKey } from '../../models/instruments/instrument-key.model';
import { PortfolioKey } from '../../models/portfolio-key.model';
import {WidgetInstance} from "../../models/dashboard/dashboard-item.model";

export class WidgetSettingsCreationHelper {
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
      const groupKey = defaultBadgeColor;
      const settings = {
        guid: widgetInstance.instance.guid,
        settingsType,
        linkToActive: true,
        ...toInstrumentKey(instrumentSelection[groupKey]),
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
