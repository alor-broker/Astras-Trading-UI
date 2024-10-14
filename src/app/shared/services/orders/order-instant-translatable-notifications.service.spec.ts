import { TestBed } from '@angular/core/testing';

import { OrderInstantTranslatableNotificationsService } from './order-instant-translatable-notifications.service';
import { InstantNotificationsService } from "../instant-notifications.service";
import { TranslocoTestsModule } from '../../utils/testing/translocoTestsModule';

describe('OrderInstantTranslatableNotificationsService', () => {
  let service: OrderInstantTranslatableNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      providers: [
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(OrderInstantTranslatableNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
