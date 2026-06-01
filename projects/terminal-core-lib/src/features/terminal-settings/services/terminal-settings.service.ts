import {
  inject,
  Injectable
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  Actions,
  ofType
} from '@ngrx/effects';
import {TerminalSettings} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {
  filter,
  map,
  Observable,
  take
} from 'rxjs';
import {TerminalSettingsFeature} from "../store/reducer";
import {EntityStatus} from "../../../common/types/entity-status.types";
import {
  TerminalSettingsEventsActions,
  TerminalSettingsInternalActions,
  TerminalSettingsServicesActions
} from '../store/actions';

@Injectable()
export class TerminalSettingsService {
  private readonly store = inject(Store);

  private readonly actions$ = inject(Actions);

  getSettings(ignoreStatus = false): Observable<TerminalSettings> {
    return this.store.select(TerminalSettingsFeature.selectTerminalSettingsState)
      .pipe(
        filter(x => x.status === EntityStatus.Success || ignoreStatus),
        map(settings => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings)
      );
  }

  updateSettings(updates: Partial<TerminalSettings>, freezeChanges = false, callback?: () => void): void {
    if (callback) {
      this.actions$.pipe(
        ofType(TerminalSettingsEventsActions.saveSuccess),
        take(1)
      ).subscribe(() => callback());
    }

    this.store.dispatch(TerminalSettingsServicesActions.update({updates, freezeChanges}));
  }

  reset(): void {
    this.actions$.pipe(
      ofType(TerminalSettingsEventsActions.resetSuccess),
      take(1)
    ).subscribe(() => window.location.reload());

    this.store.dispatch(TerminalSettingsServicesActions.reset());
  }

  init(settings: TerminalSettings | null): void {
    this.store.select(TerminalSettingsFeature.selectTerminalSettingsState)
      .pipe(
        filter(x => x.status === EntityStatus.Initial),
        take(1)
      ).subscribe(() => this.store.dispatch(TerminalSettingsInternalActions.init({settings})));
  }

  onUpdate(): Observable<void> {
    return this.actions$.pipe(
      ofType(TerminalSettingsServicesActions.update),
      map(() => undefined)
    );
  }

  onReset(): Observable<void> {
    return this.actions$.pipe(
      ofType(TerminalSettingsServicesActions.reset),
      map(() => undefined)
    );
  }

  notifySaveSuccess(): void {
    this.store.dispatch(TerminalSettingsEventsActions.saveSuccess());
  }

  notifyResetSuccess(): void {
    this.store.dispatch(TerminalSettingsEventsActions.resetSuccess());
  }
}
