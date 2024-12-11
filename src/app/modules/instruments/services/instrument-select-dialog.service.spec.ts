import { TestBed } from '@angular/core/testing';

import { InstrumentSelectDialogService } from './instrument-select-dialog.service';

describe('InstrumentSelectDialogService', () => {
  let service: InstrumentSelectDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstrumentSelectDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
