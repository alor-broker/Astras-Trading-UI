import { TestBed } from '@angular/core/testing';

import { AiChatService } from './ai-chat.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { Subject } from "rxjs";

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
        },
        {
          provide: EnvironmentService,
          useValue: {
            get apiUrl(): string {
              return '';
            }
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: new Subject()
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
