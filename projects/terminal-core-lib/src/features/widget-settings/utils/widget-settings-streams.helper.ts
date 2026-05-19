import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {
  map,
  Observable
} from 'rxjs';
import {mapWith} from '../../../common/utils/observable/map-with';
import {WidgetSettingsService} from '../services/widget-settings.service';

export class WidgetSettingsStreamsHelper {
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
