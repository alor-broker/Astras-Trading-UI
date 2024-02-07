import { TestBed } from '@angular/core/testing';

import { HelpService } from './help.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

describe('HelpService', () => {
  let service: HelpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {}
        },
      ]
    });
    service = TestBed.inject(HelpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
