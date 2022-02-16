import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { SyncService } from 'src/app/shared/services/sync.service';

import { InfoService } from './info.service';

describe('InfoService', () => {
  let service: InfoService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const dashboardSpy = jasmine.createSpyObj('DashboardService', ['getSettings'])
  const syncSpy = jasmine.createSpyObj('SyncService', ['selectedInstrument$'])

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardSpy },
        { provide: SyncService, useValue: syncSpy },
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
