import { Injectable } from '@angular/core';
import { distinct, filter, tap } from 'rxjs';
import { AnySettings } from '../models/settings/any-settings.model';
import { isEqual } from '../utils/settings-helper';
import { DashboardService } from './dashboard.service';

@Injectable()
export class BaseService<T extends AnySettings> {
  protected settings?: T;
  constructor(private settingsService: DashboardService) {}

  getSettings(guid: string) {
    return this.settingsService.getSettings(guid).pipe(
      filter((s): s is T => !!s),
      tap((s) => (this.settings = s)),
      distinct()
    );
  }

  setSettings(settings: T) {
    if (this.settings && !isEqual(this.settings, settings)) {
      this.settingsService.updateSettings(settings.guid, settings);
    }
  }

  setLinked(isLinked: boolean) {
    const current = this.getSettingsValue();
    if (current) {
      this.settingsService.updateSettings(current.guid, {
        ...current,
        linkToActive: isLinked,
      });
    }
  }

  getSettingsValue() {
    return this.settings;
  }
}
