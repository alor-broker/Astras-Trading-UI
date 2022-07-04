import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InfoService } from './info.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { of } from "rxjs";

describe('InfoService', () => {
  let service: InfoService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})) }
        },
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

