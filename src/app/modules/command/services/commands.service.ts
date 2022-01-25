import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CommandResponse } from 'src/app/shared/models/commands/command-response.model';
import { Side } from 'src/app/shared/models/enums/side.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { environment } from 'src/environments/environment';
import { LimitCommand } from '../models/limit-command.model';
import { MarketCommand } from '../models/market-command.model';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  private url = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions/limit'

  private limitCommand?: BehaviorSubject<LimitCommand>;
  private marketCommand?: BehaviorSubject<MarketCommand>;

  constructor(private http: HttpClient, private notification: NzNotificationService) { }

  setLimitCommand(command: LimitCommand) {
    if (!this.limitCommand) {
      this.limitCommand = new BehaviorSubject<LimitCommand>(command);
    }
    this.limitCommand?.next(command);
  }

  setMarketCommand(command: MarketCommand) {
    if (!this.marketCommand) {
      this.marketCommand = new BehaviorSubject<MarketCommand>(command);
    }
    this.marketCommand?.next(command);
  }

  submitLimit(side: Side) {
    const command = this.limitCommand?.getValue();
    if (command) {
      return this.placeOrder("limit", side, command);
    }
    else {
      throw new Error('Empty command')
    }
  }

  submitMarket(side: Side) {
    const command = this.marketCommand?.getValue();
    if (command) {
      return this.placeOrder("market", side, command);
    }
    else {
      throw new Error('Empty command')
    }
  }

  private placeOrder(type: string, side: Side, command : LimitCommand | MarketCommand) {
    command.side = side.toString();
    return this.http.post<CommandResponse>(this.url, {
        ...command,
        type: type
      }, {
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid()
      }
    }).pipe(
      tap(resp => {
        if (resp.orderNumber) {
          this.notification.success(`Заявка выставлена`, `Заявка успешно выставлена, её номер на бирже: \n ${resp.orderNumber}`)
        }
      })
    )
  }
}
