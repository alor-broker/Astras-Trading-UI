import { TestBed } from '@angular/core/testing';

import { WidgetLocalStateService } from './widget-local-state.service';

describe('WidgetLocalStateService', () => {
  let service: WidgetLocalStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetLocalStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
