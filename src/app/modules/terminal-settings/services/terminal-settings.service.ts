import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientService } from 'src/app/shared/services/client.service';
import { FullName } from '../../../shared/models/user/full-name.model';

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  constructor(
    private profile: ClientService) { }

  getFullName() : Observable<FullName> {
    return this.profile.getFullName();
  }
}
