import { TestBed } from '@angular/core/testing';

import { FeedbackService } from './feedback.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('FeedbackService', () => {
  let service: FeedbackService;
  let httpClient: HttpClient;
  let httpClientController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            setItem: jasmine.createSpy('setItem').and.callThrough(),
          }
        },
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

    service = TestBed.inject(FeedbackService);
    httpClient = TestBed.inject(HttpClient);
    httpClientController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
