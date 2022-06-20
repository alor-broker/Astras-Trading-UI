import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { InstrumentsService } from './instruments.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        InstrumentsService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
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
