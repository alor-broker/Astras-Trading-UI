import { TestBed } from '@angular/core/testing';

import { AiChatService } from './ai-chat.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { Subject } from "rxjs";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AiChatService', () => {
  let service: AiChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: LoggerService,
            useValue: {
                error: jasmine.createSpy('error').and.callThrough()
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
        },
        {
            provide: TerminalSettingsService,
            useValue: {
                getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(AiChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
