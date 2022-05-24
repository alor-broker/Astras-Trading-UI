import { TestBed } from '@angular/core/testing';
import { AnySettings } from '../models/settings/any-settings.model';
import { BaseService } from './base.service';
import { DashboardService } from './dashboard.service';

describe('BaseService', () => {
  let service: BaseService<AnySettings>;
  let settingsServiceSpy = jasmine.createSpyObj('DashboardService', ['getSettings', 'updateSettings']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BaseService,
        { provide: DashboardService, useValue: settingsServiceSpy }
      ]
    });

    service = TestBed.inject(BaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
