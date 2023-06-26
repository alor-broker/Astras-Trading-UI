import {Store} from "@ngrx/store";
import {filter, Observable} from "rxjs";
import {EntityStatus} from "../../shared/models/enums/entity-status";
import {map} from "rxjs/operators";
import {TerminalSettings} from "../../shared/models/terminal-settings/terminal-settings.model";
import {selectTerminalSettingsState} from "./terminal-settings.selectors";

export class TerminalSettingsStreams {
  static getSettings(store: Store): Observable<TerminalSettings> {
    return store.select(selectTerminalSettingsState)
      .pipe(
        filter(x => x.status === EntityStatus.Success),
        map(settings => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings)
      );
  }
}
