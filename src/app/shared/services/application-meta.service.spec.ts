import { TestBed } from '@angular/core/testing';

import { ApplicationMetaService } from './application-meta.service';

describe('ApplicationMetaService', () => {
  let service: ApplicationMetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
