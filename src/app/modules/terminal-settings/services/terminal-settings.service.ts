import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/shared/services/account.service';
import { FullName } from '../../../shared/models/user/full-name.model';

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  constructor(
    private profile: AccountService) { }

  getFullName() : Observable<FullName> {
    return this.profile.getFullName();
  }
}
