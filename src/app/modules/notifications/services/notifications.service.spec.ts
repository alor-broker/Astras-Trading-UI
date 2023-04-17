import { TestBed } from '@angular/core/testing';

import { NotificationsService } from './notifications.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../../../shared/utils/testing';
import { of, Subject } from "rxjs";
import { PushNotificationsService } from "../../push-notifications/services/push-notifications.service";

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[...sharedModuleImportForTests],
      providers:[
        ...commonTestProviders,
        {
          provide: PushNotificationsService,
          useValue: {
            subscribeToOrderExecute: jasmine.createSpy('subscribeToOrderExecute').and.returnValue(of({})),
            getMessages: jasmine.createSpy('getMessages').and.returnValue(new Subject()),
          }
        }
      ]
    });
    service = TestBed.inject(NotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
