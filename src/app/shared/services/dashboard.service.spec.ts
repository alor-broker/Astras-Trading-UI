import { TestBed } from '@angular/core/testing';

import { DashboardService } from './dashboard.service';
import { WidgetFactoryService } from './widget-factory.service';
import { LocalStorageService } from "./local-storage.service";

describe('DashboardService', () => {
  let service: DashboardService;
  const factorySpy = jasmine.createSpyObj('WidgetFactoryService', ['createNewSettings']);
  let localStorageServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: WidgetFactoryService, useValue: factorySpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
      ]
    });
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
