import { TestBed } from '@angular/core/testing';

import { SuggestionsService } from './suggestions.service';
import { TranslocoTestsModule } from "../../../shared/utils/testing/translocoTestsModule";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(ErrorHandlerService)
      ]
    });
    service = TestBed.inject(SuggestionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
