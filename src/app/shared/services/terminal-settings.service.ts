import { Injectable, inject } from '@angular/core';
import {
  Observable,
  take
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  Actions,
  ofType
} from "@ngrx/effects";
import { TerminalSettingsStreams } from "../../store/terminal-settings/terminal-settings.streams";
import { TerminalSettings } from "../models/terminal-settings/terminal-settings.model";
import {
  TerminalSettingsEventsActions,
  TerminalSettingsServicesActions
} from "../../store/terminal-settings/terminal-settings.actions";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  getSettings(ignoreStatus = false): Observable<TerminalSettings> {
    return TerminalSettingsStreams.getSettings(this.store, ignoreStatus);
  }

  updateSettings(updates: Partial<TerminalSettings>, freezeChanges = false, callback?: () => void): void {
    if (callback) {
      this.actions$.pipe(
        ofType(TerminalSettingsEventsActions.saveSuccess),
        take(1)
      ).subscribe(() => callback());
    }

    this.store.dispatch(TerminalSettingsServicesActions.update({ updates, freezeChanges }));
  }

  reset(): void {
    this.actions$.pipe(
      ofType(TerminalSettingsEventsActions.resetSuccess),
      take(1)
    ).subscribe(() => window.location.reload());

    this.store.dispatch(TerminalSettingsServicesActions.reset());
  }
}
