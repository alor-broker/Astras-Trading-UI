import {AppHook} from "./app-hook-token";
import {Injectable} from "@angular/core";
import {Store} from "@ngrx/store";
import {initTerminalSettings} from "../../../store/terminal-settings/terminal-settings.actions";

@Injectable()
export class InitTerminalSettingsHook implements AppHook {
  constructor(private readonly store: Store) {
  }

  onDestroy(): void {
  }

  onInit(): void {
    this.store.dispatch(initTerminalSettings());
  }
}
