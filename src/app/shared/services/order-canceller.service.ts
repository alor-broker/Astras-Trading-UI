import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  tap
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CancelCommand } from '../models/commands/cancel-command.model';
import { CommandResponse } from '../models/commands/command-response.model';
import { GuidGenerator } from '../utils/guid';
import { InstantNotificationsService } from './instant-notifications.service';
import { OrdersInstantNotificationType } from '../models/terminal-settings/terminal-settings.model';
import {ErrorHandlerService} from "./handle-error/error-handler.service";
import {catchHttpError} from "../utils/observable-helper";

@Injectable({
  providedIn: 'root'
})
export class OrderCancellerService {
  private url = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders';

  constructor(
    private readonly http: HttpClient,
    private readonly instantNotificationsService: InstantNotificationsService,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

  cancelOrder(command: CancelCommand) : Observable<CommandResponse | null> {
    return this.http.delete<CommandResponse>(`${this.url}/${command.orderid}`, {
      params: { ...command, jsonResponse: true },
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid()
      }
    }).pipe(
      catchHttpError<CommandResponse | null>(null, this.errorHandlerService),
      tap(resp => {
        if (resp?.orderNumber) {
          this.instantNotificationsService.showNotification(
            OrdersInstantNotificationType.OrderCancelled,
            'success',
            `Заявка отменена`,
            `Заявка ${command.orderid} на ${command.exchange} успешно отменена`
          );
        }
      })
    );
  }
}
