import { TestBed } from '@angular/core/testing';

import { InstantNotificationsService } from './instant-notifications.service';
import { Subject } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {TerminalSettingsService} from "./terminal-settings.service";

describe('InstantNotificationsService', () => {
  let service: InstantNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: NzNotificationService,
          useValue: jasmine.createSpyObj(
            'NzNotificationService',
            [
              'info',
              'success',
              'error'
            ]
          )
        }
      ]
    });
    service = TestBed.inject(InstantNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
