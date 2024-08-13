import { TestBed } from '@angular/core/testing';

import { HelpService } from './help.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HelpService', () => {
  let service: HelpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: ErrorHandlerService,
            useValue: {}
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});
    service = TestBed.inject(HelpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
