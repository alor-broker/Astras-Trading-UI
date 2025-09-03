import { TestBed } from '@angular/core/testing';

import { AiChatTermsOfUseService } from './ai-chat-terms-of-use.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { TranslocoTestsModule } from "../../../shared/utils/testing/translocoTestsModule";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('AiChatTermsOfUseService', () => {
  let service: AiChatTermsOfUseService;

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
    service = TestBed.inject(AiChatTermsOfUseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
