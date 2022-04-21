import { Injectable } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { AnySettings } from '../models/settings/any-settings.model';
import { BaseRequest } from '../models/ws/base-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { GuidGenerator } from '../utils/guid';
import { BaseService } from './base.service';
import { DashboardService } from './dashboard.service';
import { WebsocketService } from './websocket.service';

@Injectable()
export abstract class BaseWebsocketService<T extends AnySettings> extends BaseService<T> {
private subGuidByOpCode = new Map<string, string>();

constructor(private ws: WebsocketService, settingsService: DashboardService) {
  super(settingsService);
}

unsubscribe() {
  if (this.subGuidByOpCode) {
    for (const [guid,] of this.subGuidByOpCode) {
      this.ws.unsubscribe(guid);
    }
  }
}

protected getEntity<T>(request: BaseRequest) : Observable<T> {
  this.ws.connect();
  let guid = this.subGuidByOpCode.get(request.opcode);
  if (guid) {
    this.ws.unsubscribe(guid);
  }

  if (request.guid) {
    guid = request.guid;
  }
  else {
    guid = GuidGenerator.newGuid();
    request.guid = guid;
  }
  this.subGuidByOpCode.set(request.opcode, guid);
  this.ws.subscribe(request);

  return this.ws.messages$.pipe(
    filter(m => m.guid == guid),
    filter((m): m is BaseResponse<T> => !!m),
    map(r => r.data));
}

protected getPortfolioEntity<T>(portfolio: string, exchange: string, opcode: string, isConstructedGuid = false) {
  const guid = isConstructedGuid ? `${portfolio}${exchange}${opcode}` : '';
  const request = {
    opcode,
    portfolio,
    exchange,
    format:"simple",
    guid: guid
  };
  return this.getEntity<T>(request);
}


}
