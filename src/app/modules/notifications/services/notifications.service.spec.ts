import { TestBed } from '@angular/core/testing';

import { NotificationsService } from './notifications.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../../../shared/utils/testing';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[...sharedModuleImportForTests],
      providers:[
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(NotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
