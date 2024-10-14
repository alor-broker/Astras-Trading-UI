import { TestBed } from '@angular/core/testing';

import { TranslatorService } from './translator.service';
import { TranslocoTestsModule } from "../utils/testing/translocoTestsModule";

describe('TranslatorService', () => {
  let service: TranslatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()]
    });
    service = TestBed.inject(TranslatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
