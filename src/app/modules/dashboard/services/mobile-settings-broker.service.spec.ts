import { TestBed } from '@angular/core/testing';

import { MobileSettingsBrokerService } from './mobile-settings-broker.service';
import {commonTestProviders, sharedModuleImportForTests} from "../../../shared/utils/testing";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";
import {Subject} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('MobileSettingsBrokerService', () => {
  let service: MobileSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            setItem: jasmine.createSpy('setItem').and.callThrough(),
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            removeItem: jasmine.createSpy('removeItem').and.callThrough(),
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            clientDataUrl : ''
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(MobileSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
