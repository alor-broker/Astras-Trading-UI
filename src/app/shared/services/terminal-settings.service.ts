import {Injectable} from '@angular/core';
import {Observable, take} from 'rxjs';
import {Store} from '@ngrx/store';
import {Actions, ofType} from "@ngrx/effects";
import {TerminalSettingsStreams} from "../../store/terminal-settings/terminal-settings.streams";
import {TerminalSettings} from "../models/terminal-settings/terminal-settings.model";
import {TerminalSettingsActions} from "../../store/terminal-settings/terminal-settings.actions";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  constructor(
    private readonly store: Store,
    private readonly actions$: Actions
  ) {
  }

  getSettings(ignoreStatus = false): Observable<TerminalSettings> {
    return TerminalSettingsStreams.getSettings(this.store, ignoreStatus);
  }

  updateSettings(updates: Partial<TerminalSettings>, freezeChanges = false, callback?: () => void) {
    if (callback) {
      this.actions$.pipe(
        ofType(TerminalSettingsActions.saveTerminalSettingsSuccess),
        take(1)
      ).subscribe(() => callback());
    }

    this.store.dispatch(TerminalSettingsActions.updateTerminalSettings({updates, freezeChanges}));
  }

  reset() {
    this.actions$.pipe(
      ofType(TerminalSettingsActions.resetSuccess),
      take(1)
    ).subscribe(() => window.location.reload());

    this.store.dispatch(TerminalSettingsActions.reset());
  }
}
