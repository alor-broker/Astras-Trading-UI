import { TestBed } from '@angular/core/testing';

import { TranslatorService } from './translator.service';
import { TranslocoTestingModule } from "@ngneat/transloco";

describe('TranslatorService', () => {
  let service: TranslatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestingModule]
    });
    service = TestBed.inject(TranslatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
