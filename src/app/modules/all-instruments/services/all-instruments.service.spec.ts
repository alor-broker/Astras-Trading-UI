import { TestBed } from '@angular/core/testing';

import { AllInstrumentsService } from './all-instruments.service';

describe('AllInstrumentsService', () => {
  let service: AllInstrumentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
