import { TestBed } from '@angular/core/testing';

import { EventsCalendarService } from './events-calendar.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('EventsCalendarService', () => {
  let service: EventsCalendarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
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
                apiUrl: ''
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(EventsCalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
