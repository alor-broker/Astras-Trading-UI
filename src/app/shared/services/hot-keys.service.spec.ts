import { TestBed } from '@angular/core/testing';

import { HotKeysService } from './hot-keys.service';

describe('HotKeysService', () => {
  let service: HotKeysService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HotKeysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
