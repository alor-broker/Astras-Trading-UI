import { TestBed } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';
import { DashboardService } from './dashboard.service';

describe('WidgetSettingsService', () => {
  let service: WidgetSettingsService;
  let dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['updateSettings']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        WidgetSettingsService
      ],
    });

    service = TestBed.inject(WidgetSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

