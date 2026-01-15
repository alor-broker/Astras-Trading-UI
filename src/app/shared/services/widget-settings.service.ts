import { Injectable, inject } from '@angular/core';
import {
  filter,
  Observable
} from 'rxjs';
import {Store} from "@ngrx/store";
import {WidgetSettingsServiceActions } from "../../store/widget-settings/widget-settings.actions";
import {map} from 'rxjs/operators';
import {WidgetSettings} from '../models/widget-settings.model';
import {LoggerService} from './logging/logger.service';
import {WidgetSettingsStreams} from "../../store/widget-settings/widget-settings.streams";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsService {
  private readonly store = inject(Store);
  private readonly logger = inject(LoggerService);

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

  getAllSettings(): Observable<WidgetSettings[]> {
    return WidgetSettingsStreams.getAllSettings(this.store);
  }

  addSettings(settings: WidgetSettings[]): void {
    this.store.dispatch(WidgetSettingsServiceActions.add({settings}));
  }

  updateSettings<T extends WidgetSettings>(guid: string, changes: Partial<T>): void {
    if (!guid) {
      this.logger.warn('WidgetSettingsService', 'updateSettings', 'GUID is empty');
      return;
    }

    this.store.dispatch(WidgetSettingsServiceActions.updateContent({settingGuid: guid, changes}));
  }

  updateIsLinked(guid: string, isLinked: boolean): void {
    if (!guid) {
      this.logger.warn('WidgetSettingsService', 'updateIsLinked', 'GUID is empty');
      return;
    }

    this.store.dispatch(WidgetSettingsServiceActions.updateContent({settingGuid: guid, changes: {linkToActive: isLinked}}));
  }
}
