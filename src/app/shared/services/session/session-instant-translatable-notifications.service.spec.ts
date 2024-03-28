import { TestBed } from '@angular/core/testing';

import { SessionInstantTranslatableNotificationsService } from './session-instant-translatable-notifications.service';
import { InstantNotificationsService } from "../instant-notifications.service";
import { getTranslocoModule } from "../../utils/testing";

describe('SessionInstantTranslatableNotificationsService', () => {
  let service: SessionInstantTranslatableNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      providers: [
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(SessionInstantTranslatableNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
