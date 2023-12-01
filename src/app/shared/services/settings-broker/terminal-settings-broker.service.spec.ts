import { TestBed } from '@angular/core/testing';

import { TerminalSettingsBrokerService } from './terminal-settings-broker.service';
import { RemoteStorageService } from "./remote-storage.service";
import {
  of,
  Subject
} from "rxjs";
import { TerminalSettingsDesktopMigrationManager } from "../../../modules/settings-migration/terminal-settings/terminal-settings-desktop-migration-manager";

describe('TerminalSettingsBrokerService', () => {
  let service: TerminalSettingsBrokerService;

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
          provide: TerminalSettingsDesktopMigrationManager,
          useValue: {
            applyMigrations: jasmine.createSpy('applyMigrations').and.returnValue((input: any) => of(input))
          }
        }
      ]
    });
    service = TestBed.inject(TerminalSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
