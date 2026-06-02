import {
  inject,
  Injectable
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable
} from 'rxjs';
import {TimezoneConverter} from '../utils/timezone-converter';
import {map} from 'rxjs/operators';
import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {TimezoneDisplayOption} from '../../terminal-settings/terminal-settings.types';

@Injectable({providedIn: 'root'})
export class TimezoneConverterService {
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  public getConverter(): Observable<TimezoneConverter> {
    return this.terminalSettingsService.getSettings()
      .pipe(
        map(x => x.timezoneDisplayOption ?? TimezoneDisplayOption.MskTime),
        distinctUntilChanged((previous, current) => previous === current),
        map(x => new TimezoneConverter(x))
      );
  }
}
