import { TestBed } from '@angular/core/testing';

import { BoardsService } from './boards.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('BoardsService', () => {
  let service: BoardsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: ErrorHandlerService,
            useValue: {
                handleError: jasmine.createSpy('handleError').and.callThrough()
            },
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
    service = TestBed.inject(BoardsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
