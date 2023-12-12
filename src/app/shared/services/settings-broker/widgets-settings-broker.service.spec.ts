import { TestBed } from '@angular/core/testing';

import { WidgetsSettingsBrokerService } from './widgets-settings-broker.service';
import { RemoteStorageService } from "./remote-storage.service";
import {
  of,
  Subject
} from "rxjs";
import { ApplicationMetaService } from "../application-meta.service";
import { WidgetSettingsDesktopMigrationManager } from "../../../modules/settings-migration/widget-settings/widget-settings-desktop-migration-manager";

describe('WidgetsSettingsBrokerService', () => {
  let service: WidgetsSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RemoteStorageService,
          useValue: {
            getGroup: jasmine.createSpy('getGroup').and.returnValue(new Subject()),
            removeGroup: jasmine.createSpy('removeGroup').and.returnValue(new Subject()),
            setRecord: jasmine.createSpy('setRecord').and.returnValue(new Subject()),
            removeRecord: jasmine.createSpy('removeRecord').and.returnValue(new Subject()),
          }
        },
        {
          provide: ApplicationMetaService,
          useValue: {
            getMeta: jasmine.createSpy('getMeta').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetSettingsDesktopMigrationManager,
          useValue: {
            applyMigrations: jasmine.createSpy('applyMigrations').and.returnValue((input: any) => of(input))
          }
        }
      ]
    });
    service = TestBed.inject(WidgetsSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
