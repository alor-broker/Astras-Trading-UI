import { TestBed } from '@angular/core/testing';

import { SessionInstantTranslatableNotificationsService } from './session-instant-translatable-notifications.service';
import { InstantNotificationsService } from "../instant-notifications.service";
import { TranslocoTestsModule } from "../../utils/testing/translocoTestsModule";

describe('SessionInstantTranslatableNotificationsService', () => {
  let service: SessionInstantTranslatableNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      providers: [
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough(),
            removeNotification: jasmine.createSpy('removeNotification').and.callThrough(),
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
