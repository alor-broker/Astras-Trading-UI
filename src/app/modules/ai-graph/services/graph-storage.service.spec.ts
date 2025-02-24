import { TestBed } from '@angular/core/testing';

import { GraphStorageService } from './graph-storage.service';
import {MockProvider} from "ng-mocks";
import {RemoteStorageService} from "../../../shared/services/settings-broker/remote-storage.service";
import {EMPTY} from "rxjs";
import {ApplicationMetaService} from "../../../shared/services/application-meta.service";
import {LocalStorageService} from "../../../shared/services/local-storage.service";

describe('GraphStorageService', () => {
  let service: GraphStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(
          RemoteStorageService,
          {
            removeRecord: () => EMPTY,
            getGroup: () => EMPTY,
            removeGroup: () => EMPTY,
            setRecord: () => EMPTY,
          }
        ),
        MockProvider(
          ApplicationMetaService,
          {
            getMeta: () => EMPTY
          }
        ),
        MockProvider(
          LocalStorageService,
          {
            getItem: () => undefined
          }
        )
      ]
    });
    service = TestBed.inject(GraphStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
