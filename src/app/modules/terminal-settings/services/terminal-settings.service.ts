import { Injectable } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { AccountService } from 'src/app/shared/services/account.service';
import { FullName } from '../../../shared/models/user/full-name.model';
import { Store } from '@ngrx/store';
import { TerminalSettings } from '../../../shared/models/terminal-settings/terminal-settings.model';
import { selectTerminalSettingsState } from '../../../store/terminal-settings/terminal-settings.selectors';
import { EntityStatus } from '../../../shared/models/enums/entity-status';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  constructor(private readonly profile: AccountService, private readonly store: Store) {
  }

  getFullName(): Observable<FullName> {
    return this.profile.getFullName();
  }

  getSettings(): Observable<TerminalSettings> {
    return this.store.select(selectTerminalSettingsState)
      .pipe(
        filter(x => x.status === EntityStatus.Success),
        map(settings => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings)
      );
  }
}
