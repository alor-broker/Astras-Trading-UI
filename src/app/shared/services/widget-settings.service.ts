import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AnySettings } from '../models/settings/any-settings.model';
import { DashboardService } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsService {

private settingsByGuid = new BehaviorSubject<Map<string, AnySettings>>(new Map());

constructor(private dashboard: DashboardService) { }

getSettings(guid: string) : Observable<AnySettings | null> {
  const settings$  = this.settingsByGuid.pipe(
    map((map) : AnySettings | null => {
      const settings = map.get(guid);
      if (settings) {
        return settings;
      }
      return null;
    })
  );
  return settings$;
}

setSettings(guid: string, settings: AnySettings) {
  const map = this.settingsByGuid.getValue();
  map.set(guid, settings);
  this.settingsByGuid.next(map);
  this.dashboard.updateSettings(guid, settings);
}

}
