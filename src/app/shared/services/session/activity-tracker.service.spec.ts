import { TestBed } from '@angular/core/testing';

import { ActivityTrackerService } from './activity-tracker.service';

describe('ActivityTrackerService', () => {
  let service: ActivityTrackerService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
