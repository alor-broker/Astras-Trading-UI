import {
  inject,
  Injectable
} from '@angular/core';
import {WidgetSettings} from '../widget-settings.types';
import {
  filter,
  map,
  Observable,
  take
} from 'rxjs';
import {WidgetSettingsStreams} from '../store/streams';
import {
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from '../store/actions';
import {Store} from '@ngrx/store';
import {LoggerService} from '../../logging/services/logger-service';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {WidgetSettingsFeature} from '../store/reducer';
import {
  Actions,
  ofType
} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';

@Injectable()
export class WidgetSettingsService {
  private readonly store = inject(Store);

  private readonly actions = inject(Actions);

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

    this.store.dispatch(WidgetSettingsServiceActions.updateContent({
      settingGuid: guid,
      changes: {linkToActive: isLinked}
    }));
  }

  init(settings: WidgetSettings[]): void {
    this.store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
      filter(state => state.status === EntityStatus.Initial),
      take(1)
    ).subscribe(() => this.store.dispatch(WidgetSettingsInternalActions.init({settings})));
  }

  onRemoved(): Observable<{ settingGuids: string[] }> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsServiceActions.remove,
      ),
      map(a => ({settingGuids: a.settingGuids}))
    );
  }

  onAdd(): Observable<{ settings: WidgetSettings[] }> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsServiceActions.add,
      ),
      map(a => ({settings: a.settings}))
    );
  }

  onUpdateContent(): Observable<{ guid: string }> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsServiceActions.updateContent,
      ),
      map(a => ({guid: a.settingGuid}))
    );
  }

  onUpdateInstrument(): Observable<{ guids: string[] }> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsServiceActions.updateInstrument,
      ),
      map(a => ({guids: a.updates.map(i => i.guid)}))
    );
  }

  onUpdatePortfolio(): Observable<{ guids: string[] }> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsServiceActions.updatePortfolio,
      ),
      map(a => ({guids: a.settingGuids}))
    );
  }

  onSetDefaultBadge(): Observable<{ guids: string[] }> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsInternalActions.setDefaultBadges,
      ),
      map(a => ({guids: a.settingGuids}))
    );
  }

  onAnyUpdate(): Observable<WidgetSettings[]> {
    return this.actions.pipe(
      ofType(
        WidgetSettingsServiceActions.add,
        WidgetSettingsServiceActions.updateContent,
        WidgetSettingsServiceActions.updateInstrument,
        WidgetSettingsServiceActions.updatePortfolio,
        WidgetSettingsServiceActions.remove,
        WidgetSettingsServiceActions.removeAll,
        WidgetSettingsInternalActions.setDefaultBadges
      ),
      concatLatestFrom(() => WidgetSettingsStreams.getAllSettings(this.store)),
      map(([, settings]) => settings)
    );
  }
}
