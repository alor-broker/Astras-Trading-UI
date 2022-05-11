import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CommandResponse } from 'src/app/shared/models/commands/command-response.model';
import { Side } from 'src/app/shared/models/enums/side.model';
import { addDays, toUnixTimestampSeconds } from 'src/app/shared/utils/datetime';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { environment } from 'src/environments/environment';
import { LimitCommand } from '../models/limit-command.model';
import { LimitEdit } from '../models/limit-edit.model';
import { MarketCommand } from '../models/market-command.model';
import { MarketEdit } from '../models/market-edit.model';
import { StopCommand } from '../models/stop-command.model';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  private url = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';

  private stopCommand?: BehaviorSubject<StopCommand>;
  private limitCommand?: BehaviorSubject<LimitCommand>;
  private limitEdit?: BehaviorSubject<LimitEdit>;
  private marketCommand?: BehaviorSubject<MarketCommand>;
  private marketEdit?: BehaviorSubject<MarketEdit>;

  constructor(private http: HttpClient, private notification: NzNotificationService) { }

  setStopCommand(command: StopCommand) {
    if (!this.stopCommand) {
      this.stopCommand = new BehaviorSubject<StopCommand>(command);
    }
    this.stopCommand?.next(command);
  }

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

  submitStop(side: Side) {
    const command = this.stopCommand?.getValue();
    if (command) {
      return this.placeOrder(command.price ? 'stopLimit' : 'stop', side, command);
    }
    else {
      throw new Error('Empty command');
    }
  }

  submitLimit(side: Side) {
    const command = this.limitCommand?.getValue();
    if (command) {
      return this.placeOrder("limit", side, command);
    }
    else {
      throw new Error('Empty command');
    }
  }

  submitMarket(side: Side) {
    const command = this.marketCommand?.getValue();
    if (command) {
      return this.placeOrder("market", side, command);
    }
    else {
      throw new Error('Empty command');
    }
  }

  submitLimitEdit() {
    const command = this.limitEdit?.getValue();
    if (command) {
      return this.editOrder("limit", command);
    }
    else {
      throw new Error('Empty command');
    }
  }

  submitMarketEdit() {
    const command = this.marketEdit?.getValue();
    if (command) {
      return this.editOrder("market", command);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private editOrder(type: string, command : LimitEdit | MarketEdit) {
    return this.http.put<CommandResponse>(`${this.url}/${type.toString()}/${command.id}`, {
        ...command
      }, {
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid(),
        'X-ALOR-ORIGINATOR': 'astras'
      }
    }).pipe(
      tap(resp => {
        if (resp.orderNumber) {
          this.notification.success(`Заявка изменена`, `Заявка успешно измнена, её номер на бирже: \n ${resp.orderNumber}`);
        }
      })
    );
  }

  private placeOrder(type: string, side: Side, command : LimitCommand | MarketCommand | StopCommand) {
    let isStop = false;
    if ((type == 'stop' || type == 'stopLimit') && isStopCommand(command)) {
      isStop = true;
      if (!command.stopEndUnixTime) {
        command.stopEndUnixTime = toUnixTimestampSeconds(addDays(new Date(), 30));
      }
      else if (typeof command.stopEndUnixTime === 'number') {
        command.stopEndUnixTime = Number((command.stopEndUnixTime / 1000).toFixed(0));
      }
      else {
        command.stopEndUnixTime = toUnixTimestampSeconds(command.stopEndUnixTime);
      }
    }
    return this.http.post<CommandResponse>(`${this.url}/${type.toString()}?stop=${isStop}`, {
        ...command,
        type,
        side
      }, {
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid(),
        'X-ALOR-ORIGINATOR': 'astras'
      }
    }).pipe(
      tap(resp => {
        if (resp.orderNumber) {
          this.notification.success(`Заявка выставлена`, `Заявка успешно выставлена, её номер на бирже: \n ${resp.orderNumber}`);
        }
      })
    );
  }
}

function isStopCommand(
  command: StopCommand | LimitCommand | MarketCommand
): command is StopCommand {
  return (
    command &&
    'stopEndUnixTime' in command
  );
}
