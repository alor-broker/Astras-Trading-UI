import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CancelCommand } from '../models/commands/cancel-command.model';
import { CommandResponse } from '../models/commands/command-response.model';
import { GuidGenerator } from '../utils/guid';

@Injectable({
  providedIn: 'root'
})
export class OrderCancellerService {
  private url = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders';

  constructor(private http: HttpClient, private notification: NzNotificationService) { }

  cancelOrder(command: CancelCommand) : Observable<CommandResponse> {
    return this.http.delete<CommandResponse>(`${this.url}/${command.orderid}`, {
      params: { ...command, jsonResponse: true },
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid()
      }
    }).pipe(
      tap(resp => {
        if (resp.orderNumber) {
          this.notification.success(`Заявка отменена`, `Заявка ${command.orderid} на ${command.exchange} успешно отменена`);
        }
      })
    );
  }
}
