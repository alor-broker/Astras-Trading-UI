import { TestBed } from '@angular/core/testing';

import { ScalperOrderBookInstantTranslatableNotificationsService } from './scalper-order-book-instant-translatable-notifications.service';
import { InstantNotificationsService } from "../../../shared/services/instant-notifications.service";
import { getTranslocoModule } from "../../../shared/utils/testing";

describe('ScalperOrderBookInstantTranslatableNotificationsService', () => {
  let service: ScalperOrderBookInstantTranslatableNotificationsService;

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
    service = TestBed.inject(ScalperOrderBookInstantTranslatableNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
