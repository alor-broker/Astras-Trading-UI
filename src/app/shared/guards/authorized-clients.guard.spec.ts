import { TestBed } from '@angular/core/testing';

import { AuthorizedClientsGuard } from './authorized-clients.guard';

describe('AuthorizedClientsGuard', () => {
  let guard: AuthorizedClientsGuard;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(AuthorizedClientsGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
