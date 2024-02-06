import { TestBed } from '@angular/core/testing';

import { HelpService } from './help.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe('HelpService', () => {
  let service: HelpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(HelpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
