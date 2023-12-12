import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InstrumentsService } from './instruments.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import {
  CacheOptions,
  CacheService
} from '../../../shared/services/cache.service';
import { Observable } from 'rxjs';
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  const cacheServiceSpy = {
    wrap: jasmine.createSpy('wrap').and.returnValue((getKey: () => string, loadData: () => Observable<any>, options: CacheOptions) => loadData())
  };


  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        InstrumentsService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: CacheService, useValue: cacheServiceSpy },
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        }
      ]
    });
    service = TestBed.inject(InstrumentsService);
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
