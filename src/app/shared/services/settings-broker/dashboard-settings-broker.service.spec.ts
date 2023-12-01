import { TestBed } from '@angular/core/testing';

import { DashboardSettingsBrokerService } from './dashboard-settings-broker.service';
import { RemoteStorageService } from "./remote-storage.service";
import {
  of,
  Subject
} from "rxjs";
import { ApplicationMetaService } from "../application-meta.service";
import { DashboardSettingsDesktopMigrationManager } from "../../../modules/settings-migration/dashboard-settings/dashboard-settings-desktop-migration-manager";

describe('DashboardSettingsBrokerService', () => {
  let service: DashboardSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RemoteStorageService,
          useValue: {
            getRecord: jasmine.createSpy('getRecord').and.returnValue(new Subject()),
            setRecord: jasmine.createSpy('setRecord').and.returnValue(new Subject())
          }
        },
        {
          provide: ApplicationMetaService,
          useValue: {
            getMeta: jasmine.createSpy('getMeta').and.returnValue(new Subject())
          }
        },
        {
          provide: DashboardSettingsDesktopMigrationManager,
          useValue: {
            applyMigrations: jasmine.createSpy('applyMigrations').and.returnValue((input: any) => of(input))
          }
        }
      ]
    });
    service = TestBed.inject(DashboardSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
