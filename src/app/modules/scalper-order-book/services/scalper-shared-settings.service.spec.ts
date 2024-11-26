import { TestBed } from '@angular/core/testing';

import { ScalperSharedSettingsService } from './scalper-shared-settings.service';
import { MockProviders } from "ng-mocks";
import { RemoteStorageService } from "../../../shared/services/settings-broker/remote-storage.service";
import { ApplicationMetaService } from "../../../shared/services/application-meta.service";

describe('ScalperSharedSettingsService', () => {
  let service: ScalperSharedSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProviders(
          RemoteStorageService,
          ApplicationMetaService
        )
      ]
    });
    service = TestBed.inject(ScalperSharedSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
