import { TestBed } from '@angular/core/testing';

import { InstrumentsService } from './instruments.service';

describe('InstrumentsService', () => {
  let service: InstrumentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
