import { Injectable } from '@angular/core';
import { TerminalSettingsService } from '../../modules/terminal-settings/services/terminal-settings.service';
import { distinctUntilChanged, Observable } from 'rxjs';
import { TimezoneConverter } from '../utils/timezone-converter';
import { map } from 'rxjs/operators';
import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';

@Injectable({
  providedIn: 'root'
})
export class TimezoneConverterService {

  constructor(private readonly terminalSettingsService: TerminalSettingsService) {
  }

  public getConverter(): Observable<TimezoneConverter> {
    return this.terminalSettingsService.getSettings()
      .pipe(
        map(x => x.timezoneDisplayOption ?? TimezoneDisplayOption.MskTime),
        distinctUntilChanged((previous, current) => !previous || previous === current),
        map(x => new TimezoneConverter(x))
      );
  }
}
