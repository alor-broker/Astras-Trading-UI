import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {
  map,
  Observable
} from 'rxjs';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';

export class WidgetBadgeHelper {
  static showBadge(
    widgetGuid: string,
    widgetSettingsService: WidgetSettingsService,
    terminalSettingsService: TerminalSettingsService): Observable<boolean> {
    return widgetSettingsService.getSettings(widgetGuid).pipe(
      mapWith(() => terminalSettingsService.getSettings(), (ws, ts) => ({ws, ts})),
      map(({ws, ts}) => ts.badgesBind === true && (ws.linkToActive ?? true) && ws.badgeColor != null)
    );
  }
}
