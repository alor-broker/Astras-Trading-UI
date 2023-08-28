import {TestBed} from '@angular/core/testing';

import {WidgetsSettingsBrokerService} from './widgets-settings-broker.service';
import {RemoteStorageService} from "./remote-storage.service";
import {Subject} from "rxjs";
import {LocalStorageService} from "../local-storage.service";
import {ApplicationMetaService} from "../application-meta.service";

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
          provide: LocalStorageService,
          useValue: {
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            removeItem: jasmine.createSpy('removeItem').and.callThrough()
          }
        },
        {
          provide: ApplicationMetaService,
          useValue: {
            getMeta: jasmine.createSpy('getMeta').and.returnValue(new Subject())
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
