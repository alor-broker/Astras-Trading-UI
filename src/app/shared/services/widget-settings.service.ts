import { Injectable } from '@angular/core';
import {
  filter,
  Observable
} from 'rxjs';
import { Store } from "@ngrx/store";
import {
  getAllSettings,
  getSettingsByGuid
} from "../../store/widget-settings/widget-settings.selectors";
import {
  addWidgetSettings,
  updateWidgetSettings
} from "../../store/widget-settings/widget-settings.actions";
import { map } from 'rxjs/operators';
import { WidgetSettings } from '../models/widget-settings.model';
import { LoggerService } from './logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsService {
  constructor(private readonly store: Store, private readonly logger: LoggerService) {
  }

  getSettings<T extends WidgetSettings>(guid: string): Observable<T> {
    return this.store.select(getSettingsByGuid(guid)).pipe(
      filter((s): s is T => !!s)
    );
  }

  getSettingsOrNull<T extends WidgetSettings>(guid: string): Observable<T | null> {
    return this.store.select(getSettingsByGuid(guid)).pipe(
      map(x => <T | null>x)
    );
  }

  getSettingsByColor(color: string): Observable<WidgetSettings[]> {
    return this.store.select(getAllSettings).pipe(
      map(s => s.filter(x => x.badgeColor === color))
    );
  }

  addSettings(settings: WidgetSettings[]) {
    this.store.dispatch(addWidgetSettings({ settings }));
  }

  updateSettings<T extends WidgetSettings>(guid: string, changes: Partial<T>) {
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
}
