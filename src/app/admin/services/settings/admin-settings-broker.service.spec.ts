import { TestBed } from '@angular/core/testing';

import { AdminSettingsBrokerService } from './admin-settings-broker.service';
import {StoreModule} from "@ngrx/store";
import {MockProviders} from "ng-mocks";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";
import {GlobalLoadingIndicatorService} from "../../../shared/services/global-loading-indicator.service";
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";

describe('AdminSettingsBrokerService', () => {
  let service: AdminSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot()
      ],
      providers: [
        ...MockProviders(
          LocalStorageService,
          TerminalSettingsService,
          GlobalLoadingIndicatorService,
          ManageDashboardsService
        )
      ]
    });
    service = TestBed.inject(AdminSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
