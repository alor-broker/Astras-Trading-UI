import { TestBed } from '@angular/core/testing';

import { NavigationStackService } from './navigation-stack.service';

describe('NavigationStackService', () => {
  let service: NavigationStackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationStackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
