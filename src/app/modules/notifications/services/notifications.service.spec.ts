import { TestBed } from '@angular/core/testing';

import { NotificationsService } from './notifications.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[...sharedModuleImportForTests]
    });
    service = TestBed.inject(NotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
