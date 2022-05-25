import { TestBed } from '@angular/core/testing';
import { AnySettings } from '../models/settings/any-settings.model';
import { BaseWebsocketService } from './base-websocket.service';
import { DashboardService } from './dashboard.service';
import { WebsocketService } from './websocket.service';

describe('BaseWebsocketService', () => {
  let service: BaseWebsocketService<AnySettings>;
  const wsSpy = jasmine.createSpyObj('WebsocketService', ['connect']);
  const dashSpy = jasmine.createSpyObj('DashboardService', ['getSettings', 'updateSettings']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: wsSpy },
        { provide: DashboardService, useValue: dashSpy },
        BaseWebsocketService,
      ]
    });

    service = TestBed.inject(BaseWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
