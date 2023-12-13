import { Injectable } from '@angular/core';
import { distinctUntilChanged, Observable } from 'rxjs';
import { TimezoneConverter } from '../utils/timezone-converter';
import { map } from 'rxjs/operators';
import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';
import {TerminalSettingsService} from "./terminal-settings.service";

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
        distinctUntilChanged((previous, current) => previous === current),
        map(x => new TimezoneConverter(x))
      );
  }
}
