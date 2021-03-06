import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HistoryService } from 'src/app/shared/services/history.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

import { LightChartService } from './light-chart.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { of } from "rxjs";

describe('LightChartService', () => {
  let service: LightChartService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  const spyHistory = jasmine.createSpyObj('HistoryService', ['getHistory']);
  const instrumentsSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);

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
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateIsLinked: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        { provide: WebsocketService, useValue: spy },
        { provide: HistoryService, useValue: spyHistory },
        { provide: InstrumentsService, useValue: instrumentsSpy },
        LightChartService
      ]
    });
    service = TestBed.inject(LightChartService);
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
