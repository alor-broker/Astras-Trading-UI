import { TestBed } from '@angular/core/testing';

import { GlobalLoadingIndicatorService } from './global-loading-indicator.service';

describe('GlobalLoadingIndicatorService', () => {
  let service: GlobalLoadingIndicatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalLoadingIndicatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
