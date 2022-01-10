import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

import { LightChartService } from './light-chart.service';

describe('LightChartService', () => {
  let service: LightChartService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        { provide: WebsocketService, useValue: spy },
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
