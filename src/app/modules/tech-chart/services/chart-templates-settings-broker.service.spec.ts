import { TestBed } from '@angular/core/testing';

import { ChartTemplatesSettingsBrokerService } from './chart-templates-settings-broker.service';
import { RemoteStorageService } from "../../../shared/services/settings-broker/remote-storage.service";
import { Subject } from "rxjs";
import { ApplicationMetaService } from "../../../shared/services/application-meta.service";

describe('ChartTemplatesSettingsBrokerService', () => {
  let service: ChartTemplatesSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RemoteStorageService,
          useValue: {
            getGroup: jasmine.createSpy('getGroup').and.returnValue(new Subject()),
            setRecord: jasmine.createSpy('setRecord').and.returnValue(new Subject()),
            removeRecord: jasmine.createSpy('removeRecord').and.returnValue(new Subject())
          }
        },
        {
          provide: ApplicationMetaService,
          useValue: {
            getMeta: jasmine.createSpy('getMeta').and.returnValue(new Subject())
          }
        },
      ]
    });
    service = TestBed.inject(ChartTemplatesSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
