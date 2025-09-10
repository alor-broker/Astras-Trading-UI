import { TestBed } from '@angular/core/testing';

import { AdminClientsService } from './admin-clients.service';

describe('AdminClientsService', () => {
  let service: AdminClientsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminClientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
