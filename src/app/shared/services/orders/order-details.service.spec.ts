import {TestBed} from '@angular/core/testing';

import {OrderDetailsService} from './order-details.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import { EnvironmentService } from "../environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('OrderDetailsService', () => {
  let service: OrderDetailsService;

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
    service = TestBed.inject(OrderDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
