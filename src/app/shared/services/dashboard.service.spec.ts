import { TestBed } from '@angular/core/testing';

import { DashboardService } from './dashboard.service';
import { WidgetFactoryService } from './widget-factory.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const factorySpy = jasmine.createSpyObj('WidgetFactoryService', ['createNewSettings']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: WidgetFactoryService, useValue: factorySpy }
      ]
    });
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
