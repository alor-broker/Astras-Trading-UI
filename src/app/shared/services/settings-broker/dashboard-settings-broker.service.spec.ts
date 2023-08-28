import {TestBed} from '@angular/core/testing';

import {DashboardSettingsBrokerService} from './dashboard-settings-broker.service';
import {RemoteStorageService} from "./remote-storage.service";
import {Subject} from "rxjs";
import {LocalStorageService} from "../local-storage.service";
import {ApplicationMetaService} from "../application-meta.service";

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
    service = TestBed.inject(DashboardSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
