import { Injectable } from '@angular/core';
import {
  filter,
  map,
  Observable
} from 'rxjs';
import { BaseRequest } from '../models/ws/base-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { GuidGenerator } from '../utils/guid';
import { WebsocketService } from './websocket.service';

@Injectable()
export abstract class BaseWebsocketService {
  private subGuids = new Set<string>();

  protected constructor(private readonly ws: WebsocketService) {
  }

  unsubscribe() {
    this.subGuids.forEach(guid => {
      this.ws.unsubscribe(guid);
    });
  }

  protected getEntity<T>(request: BaseRequest): Observable<T> {
    this.ws.connect();
    const guid = request.guid ?? GuidGenerator.newGuid();

    if(!this.subGuids.has(guid)) {
      this.subGuids.add(guid);
    } else {
      this.ws.unsubscribe(guid);
    }

    this.ws.subscribe(request);

    return this.ws.messages$.pipe(
      filter(m => m.guid == guid),
      filter((m): m is BaseResponse<T> => !!m),
      map(r => r.data));
  }

  protected getPortfolioEntity<T>(portfolio: string, exchange: string, opcode: string, trackId: string) {
    const guid = `${trackId}:${portfolio}${exchange}${opcode}`;
    const request = {
      opcode,
      portfolio,
      exchange,
      format: "simple",
      guid: guid
    };
    return this.getEntity<T>(request);
  }


}
