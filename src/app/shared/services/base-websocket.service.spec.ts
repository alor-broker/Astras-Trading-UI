/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AnySettings } from '../models/settings/any-settings.model';
import { BaseWebsocketService } from './base-websocket.service';
import { DashboardService } from './dashboard.service';
import { WebsocketService } from './websocket.service';

describe('BaseWebsocketService', () => {
  let service: BaseWebsocketService<AnySettings>;
  const wsSpy = jasmine.createSpyObj('WebsocketService', ['connect']);
  const dashSpy = jasmine.createSpyObj('DashboardService', ['getSettings', 'updateSettings']);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: wsSpy },
        { provide: DashboardService, useValue: dashSpy },
        BaseWebsocketService,
      ]
    });
  });

  it('should ...', inject([BaseWebsocketService], (service: BaseWebsocketService<AnySettings>) => {
    expect(service).toBeTruthy();
  }));
});
