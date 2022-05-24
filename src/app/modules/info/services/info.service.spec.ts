import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { InfoService } from './info.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';

describe('InfoService', () => {
  let service: InfoService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const dashboardSpy = jasmine.createSpyObj('DashboardService', ['getSettings']);
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        InfoService
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

