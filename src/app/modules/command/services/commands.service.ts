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
import { LimitEdit } from '../models/limit-edit.model';
import { MarketCommand } from '../models/market-command.model';
import { MarketEdit } from '../models/market-edit.model';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  private url = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions'

  private limitCommand?: BehaviorSubject<LimitCommand>;
  private limitEdit?: BehaviorSubject<LimitEdit>;
  private marketCommand?: BehaviorSubject<MarketCommand>;
  private marketEdit?: BehaviorSubject<MarketEdit>;

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

  setLimitEdit(command: LimitEdit) {
    if (!this.limitEdit) {
      this.limitEdit = new BehaviorSubject<LimitEdit>(command);
    }
    this.limitEdit?.next(command);
  }

  setMarketEdit(command: MarketEdit) {
    if (!this.marketEdit) {
      this.marketEdit = new BehaviorSubject<MarketEdit>(command);
    }
    this.marketEdit?.next(command);
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

  submitLimitEdit() {
    const command = this.limitEdit?.getValue();
    if (command) {
      return this.editOrder("limit", command);
    }
    else {
      throw new Error('Empty command')
    }
  }

  submitMarketEdit() {
    const command = this.marketEdit?.getValue();
    if (command) {
      return this.editOrder("market", command);
    }
    else {
      throw new Error('Empty command')
    }
  }

  private editOrder(type: string, command : LimitEdit | MarketEdit) {
    return this.http.put<CommandResponse>(`${this.url}/${type.toString()}/${command.id}`, {
        ...command
      }, {
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid()
      }
    }).pipe(
      tap(resp => {
        if (resp.orderNumber) {
          this.notification.success(`Заявка изменена`, `Заявка успешно измнена, её номер на бирже: \n ${resp.orderNumber}`)
        }
      })
    )
  }

  private placeOrder(type: string, side: Side, command : LimitCommand | MarketCommand) {
    return this.http.post<CommandResponse>(`${this.url}/${type.toString()}`, {
        ...command,
        type,
        side
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
