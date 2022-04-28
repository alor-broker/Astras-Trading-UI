import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { InfoService } from './info.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';

describe('InfoService', () => {
  let service: InfoService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const dashboardSpy = jasmine.createSpyObj('DashboardService', ['getSettings']);
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        InfoService,
        { provide: DashboardService, useValue: dashboardSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        provideMockStore(),
      ]
    });
    service = TestBed.inject(InfoService);

    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

