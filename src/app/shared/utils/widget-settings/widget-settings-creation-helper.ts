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

export class WidgetSettingsCreationHelper {
  static createWidgetSettingsIfMissing<T extends WidgetSettings>(
    widgetGuid: string,
    settingsType: string,
    fill: (settings: T) => T,
    widgetSettingsService: WidgetSettingsService) {
    widgetSettingsService.getSettingsOrNull(widgetGuid).pipe(
      take(1),
      filter(x => !x)
    ).subscribe(() => {
      const settings = {
        guid: widgetGuid,
        settingsType
      } as T;

      widgetSettingsService.addSettings([fill(settings)]);
    });
  }

  static createInstrumentLinkedWidgetSettingsIfMissing<T extends WidgetSettings & InstrumentKey>(
    widgetGuid: string,
    settingsType: string,
    fill: (settings: T) => T,
    dashboardContextService: DashboardContextService,
    widgetSettingsService: WidgetSettingsService
  ) {
    widgetSettingsService.getSettingsOrNull(widgetGuid).pipe(
      take(1),
      filter(x => !x),
      switchMap(() => dashboardContextService.instrumentsSelection$),
      take(1)
    ).subscribe(instrumentSelection => {
      const groupKey = defaultBadgeColor;
      const settings = {
        guid: widgetGuid,
        linkToActive: true,
        ...toInstrumentKey(instrumentSelection[groupKey]),
        badgeColor: groupKey

      } as T;

      widgetSettingsService.addSettings([fill(settings)]);
    });
  }

  static createPortfolioLinkedWidgetSettingsIfMissing<T extends WidgetSettings & PortfolioKey>(
    widgetGuid: string,
    settingsType: string,
    fill: (settings: T) => T,
    dashboardContextService: DashboardContextService,
    widgetSettingsService: WidgetSettingsService
  ) {
    widgetSettingsService.getSettingsOrNull(widgetGuid).pipe(
      take(1),
      filter(x => !x),
      switchMap(() => dashboardContextService.selectedPortfolio$),
      take(1)
    ).subscribe(portfolio => {
      const settings = {
        guid: widgetGuid,
        linkToActive: true,
        ...portfolio,

      } as T;

      widgetSettingsService.addSettings([fill(settings)]);
    });
  }
}
