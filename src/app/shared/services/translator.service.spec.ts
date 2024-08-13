import { TestBed } from '@angular/core/testing';

import { TranslatorService } from './translator.service';
import { getTranslocoModule } from "../utils/testing";

describe('TranslatorService', () => {
  let service: TranslatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()]
    });
    service = TestBed.inject(TranslatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
