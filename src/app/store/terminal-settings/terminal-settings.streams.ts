import { Store } from "@ngrx/store";
import {
  filter,
  Observable
} from "rxjs";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { map } from "rxjs/operators";
import { TerminalSettings } from "../../shared/models/terminal-settings/terminal-settings.model";
import { TerminalSettingsFeature } from "./terminal-settings.reducer";

export class TerminalSettingsStreams {
  static getSettings(store: Store, ignoreStatus = false): Observable<TerminalSettings> {
    return store.select(TerminalSettingsFeature.selectTerminalSettingsState)
      .pipe(
        filter(x => x.status === EntityStatus.Success || ignoreStatus),
        map(settings => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings)
      );
  }
}
