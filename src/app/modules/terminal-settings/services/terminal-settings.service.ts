import {Injectable} from '@angular/core';
import {Observable, take} from 'rxjs';
import {AccountService} from 'src/app/shared/services/account.service';
import {Store} from '@ngrx/store';
import {TerminalSettings} from '../../../shared/models/terminal-settings/terminal-settings.model';
import * as TerminalSettingsActions from "../../../store/terminal-settings/terminal-settings.actions";
import {updateTerminalSettings} from "../../../store/terminal-settings/terminal-settings.actions";
import {Actions, ofType} from "@ngrx/effects";
import {TerminalSettingsStreams} from "../../../store/terminal-settings/terminal-settings.streams";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  constructor(
    private readonly profile: AccountService,
    private readonly store: Store,
    private readonly actions$: Actions
  ) {
  }

  getSettings(): Observable<TerminalSettings> {
    return TerminalSettingsStreams.getSettings(this.store);
  }

  updateSettings(updates: Partial<TerminalSettings>, freezeChanges = false, callback?: () => void) {
    if (callback) {
      this.actions$.pipe(
        ofType(TerminalSettingsActions.saveTerminalSettingsSuccess),
        take(1)
      ).subscribe(() => callback());
    }

    this.store.dispatch(updateTerminalSettings({updates, freezeChanges}));
  }
}
