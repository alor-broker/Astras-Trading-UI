import { TestBed } from '@angular/core/testing';

import { MigrationsMetaService } from './migrations-meta.service';
import { RemoteStorageService } from "../../../shared/services/settings-broker/remote-storage.service";
import {
  Observable,
  Subject
} from "rxjs";
import { ApplicationMetaService } from "../../../shared/services/application-meta.service";
import { CacheService } from "../../../shared/services/cache.service";

describe('MigrationsMetaService', () => {
  let service: MigrationsMetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RemoteStorageService,
          useValue: {
            getGroup: jasmine.createSpy('getGroup').and.returnValue(new Subject()),
            removeGroup: jasmine.createSpy('removeGroup').and.returnValue(new Subject()),
            setRecord: jasmine.createSpy('setRecord').and.returnValue(new Subject()),
          }
        },
        {
          provide: ApplicationMetaService,
          useValue: {
            getMeta: jasmine.createSpy('getMeta').and.returnValue(new Subject())
          }
        },
        {
          provide: CacheService,
          useValue: {
            wrap: jasmine.createSpy('getMeta').and.returnValue((getKey: () => string, loadData: () => Observable<any>) => loadData())
          }
        }
      ]
    });
    service = TestBed.inject(MigrationsMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
