import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PositionsService } from './positions.service';
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { EnvironmentService } from "./environment.service";

describe('PositionsService', () => {
  let service: PositionsService;
  let httpClient: HttpClient;
  let httpClientController: HttpTestingController;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        PositionsService,
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
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpClientController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PositionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
