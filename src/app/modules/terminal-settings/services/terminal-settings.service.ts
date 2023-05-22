import {Injectable} from '@angular/core';
import {filter, Observable, take} from 'rxjs';
import {AccountService} from 'src/app/shared/services/account.service';
import {Store} from '@ngrx/store';
import {TerminalSettings} from '../../../shared/models/terminal-settings/terminal-settings.model';
import {selectTerminalSettingsState} from '../../../store/terminal-settings/terminal-settings.selectors';
import {EntityStatus} from '../../../shared/models/enums/entity-status';
import {map} from 'rxjs/operators';
import {updateTerminalSettings} from "../../../store/terminal-settings/terminal-settings.actions";
import {Actions, ofType} from "@ngrx/effects";
import * as TerminalSettingsActions from "../../../store/terminal-settings/terminal-settings.actions";

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
    return this.store.select(selectTerminalSettingsState)
      .pipe(
        filter(x => x.status === EntityStatus.Success),
        map(settings => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings)
      );
  }

  updateSettings(updates: Partial<TerminalSettings>, callback?: () => void) {
    if(callback) {
      this.actions$.pipe(
        ofType(TerminalSettingsActions.updateTerminalSettingsSuccess),
        take(1)
      ).subscribe(() => callback());
    }

    this.store.dispatch(updateTerminalSettings({updates}));
  }
}
