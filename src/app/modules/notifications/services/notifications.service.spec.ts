import { TestBed } from '@angular/core/testing';

import { NotificationsService } from './notifications.service';
import { NOTIFICATIONS_PROVIDER } from "./notifications-provider";
import { commonTestProviders } from "../../../shared/utils/testing/common-test-providers";

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ...commonTestProviders,
        {
          provide: NOTIFICATIONS_PROVIDER,
          useValue: []
        }
      ]
    });
    service = TestBed.inject(NotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
