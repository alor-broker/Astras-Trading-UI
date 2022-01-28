import { Injectable } from '@angular/core';
import { filter, map, Subscription } from 'rxjs';
import { BaseRequest } from '../models/ws/base-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { PortfolioWideRequest } from '../models/ws/portfolio-wide-request.model';
import { GuidGenerator } from '../utils/guid';
import { WebsocketService } from './websocket.service';

export abstract class BaseWebsocketService {

private subGuidByOpCode = new Map<string, string>();

constructor(private ws: WebsocketService) { }

unsubscribe() {
  if (this.subGuidByOpCode) {
    for (const [guid, _] of this.subGuidByOpCode) {
      this.ws.unsubscribe(guid);
    }
  }
}

protected getEntity<T>(request: BaseRequest) {
  this.ws.connect()
  let guid = this.subGuidByOpCode.get(request.opcode);
  if (guid) {
    this.ws.unsubscribe(guid);
  }

  if (request.guid) {
    guid = request.guid
  }
  else {
    guid = GuidGenerator.newGuid();
    request.guid = guid;
  }
  this.subGuidByOpCode.set(request.opcode, guid);
  this.ws.subscribe(request)

  return this.ws.messages$.pipe(
    filter(m => m.guid == guid),
    map(r => {
      const br = r as BaseResponse<T>;
      return br.data;
    })
  )
}

protected getPortfolioEntity<T>(portfolio: string, exchange: string, opcode: string, guid?: string) {
  const request = {
    opcode,
    portfolio,
    exchange,
    format:"simple",
    guid: ''
  }
  return this.getEntity<T>(request);
}


}
