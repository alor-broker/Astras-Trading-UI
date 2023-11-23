import {Injectable} from '@angular/core';
import {
  filter,
  Observable
} from 'rxjs';
import {Store} from "@ngrx/store";
import {addWidgetSettings, updateWidgetSettings} from "../../store/widget-settings/widget-settings.actions";
import {map} from 'rxjs/operators';
import {WidgetSettings} from '../models/widget-settings.model';
import {LoggerService} from './logging/logger.service';
import {WidgetSettingsStreams} from "../../store/widget-settings/widget-settings.streams";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsService {
  constructor(private readonly store: Store, private readonly logger: LoggerService) {
  }

  getSettings<T extends WidgetSettings>(guid: string): Observable<T> {
    return this.getSettingsOrNull(guid).pipe(
      filter((s): s is T => !!s)
    );
  }

  getSettingsOrNull<T extends WidgetSettings>(guid: string): Observable<T | null> {
    return WidgetSettingsStreams.getSettingsOrNull(this.store, guid).pipe(
      map(x => <T | null>x)
    );
  }

  getSettingsByColor(color: string): Observable<WidgetSettings[]> {
    return this.getAllSettings().pipe(
      map(s => s.filter(x => x.badgeColor === color))
    );
  }

  getAllSettings(): Observable<WidgetSettings[]> {
    return WidgetSettingsStreams.getAllSettings(this.store);
  }

  addSettings(settings: WidgetSettings[]): void {
    this.store.dispatch(addWidgetSettings({settings}));
  }

  updateSettings<T extends WidgetSettings>(guid: string, changes: Partial<T>): void {
    if (!guid) {
      this.logger.warn('WidgetSettingsService', 'updateSettings', 'GUID is empty');
      return;
    }

    this.store.dispatch(updateWidgetSettings({settingGuid: guid, changes}));
  }

  updateIsLinked(guid: string, isLinked: boolean): void {
    if (!guid) {
      this.logger.warn('WidgetSettingsService', 'updateIsLinked', 'GUID is empty');
      return;
    }

    this.store.dispatch(updateWidgetSettings({settingGuid: guid, changes: {linkToActive: isLinked}}));
  }
}
