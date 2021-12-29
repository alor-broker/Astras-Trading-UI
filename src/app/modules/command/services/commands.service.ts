import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { environment } from 'src/environments/environment';
import { LimitCommand } from '../models/limit-command.model';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  private url = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions/limit'

  constructor(private http: HttpClient) { }

  submitLimit(command: LimitCommand) {
    return this.http.post(this.url, command, {
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid()
      }
    }).pipe(
      tap(resp => {
        console.log(resp);
      })
    )
  }
}
