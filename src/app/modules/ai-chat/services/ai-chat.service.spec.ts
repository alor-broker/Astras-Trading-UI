import { TestBed } from '@angular/core/testing';

import { AiChatService } from './ai-chat.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('AiChatService', () => {
  let service: AiChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(AiChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
