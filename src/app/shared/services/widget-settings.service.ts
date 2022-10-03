import { Injectable } from '@angular/core';
import {
  filter,
  Observable
} from 'rxjs';
import { AnySettings } from '../models/settings/any-settings.model';
import { Store } from "@ngrx/store";
import {
  getAllSettings,
  getSettingsByGuid
} from "../../store/widget-settings/widget-settings.selectors";
import {
  addWidgetSettings,
  removeAllWidgetSettings,
  removeWidgetSettings,
  updateWidgetSettings
} from "../../store/widget-settings/widget-settings.actions";
import { LoggerService } from "./logger.service";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsService {
  constructor(private readonly store: Store, private readonly logger: LoggerService) {
  }

  getSettings<T extends AnySettings>(guid: string): Observable<T> {
    return this.store.select(getSettingsByGuid(guid)).pipe(
      filter((s): s is T => !!s)
    );
  }

  getSettingsByColor(color: string): Observable<AnySettings[]> {
    return this.store.select(getAllSettings).pipe(
      map(s => s.filter(x => x.badgeColor === color))
    );
  }

  addSettings(settings: AnySettings[]) {
    this.store.dispatch(addWidgetSettings({ settings }));
  }

  updateSettings<T extends AnySettings>(guid: string, changes: Partial<T>) {
    if (!guid) {
      this.logger.warn('WidgetSettingsService', 'updateSettings', 'GUID is empty');
      return;
    }

    this.store.dispatch(updateWidgetSettings({ settingGuid: guid, changes }));
  }

  updateIsLinked(guid: string, isLinked: boolean) {
    if (!guid) {
      this.logger.warn('WidgetSettingsService', 'updateIsLinked', 'GUID is empty');
      return;
    }

    this.store.dispatch(updateWidgetSettings({ settingGuid: guid, changes: { linkToActive: isLinked } }));
  }

  removeSettings(guid: string) {
    this.store.dispatch(removeWidgetSettings({ settingGuid: guid }));
  }

  removeAllSettings() {
    this.store.dispatch(removeAllWidgetSettings());
  }
}
