import { TestBed } from '@angular/core/testing';

import { WidgetsSwitcherService } from './widgets-switcher.service';

describe('WidgetsSwitcherService', () => {
  let service: WidgetsSwitcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetsSwitcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
