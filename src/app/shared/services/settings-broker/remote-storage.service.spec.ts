import { TestBed } from '@angular/core/testing';

import { RemoteStorageService } from './remote-storage.service';

describe('RemoteStorageService', () => {
  let service: RemoteStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemoteStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
