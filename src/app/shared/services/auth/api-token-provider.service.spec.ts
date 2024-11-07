import { TestBed } from '@angular/core/testing';

import { ApiTokenProviderService } from './api-token-provider.service';

describe('ApiTokenProviderService', () => {
  let service: ApiTokenProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiTokenProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
