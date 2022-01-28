/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BaseWebsocketService } from './base-websocket.service';

describe('BaseWebsocketService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaseWebsocketService]
    });
  });

  it('should ...', inject([BaseWebsocketService], (service: BaseWebsocketService) => {
    expect(service).toBeTruthy();
  }));
});
