import {MobileMigrationManagerBase} from "../mobile-migration-manager-base";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {inject, Injectable} from "@angular/core";
import {AddHomeScreenMobileDashboardSettings} from "./migrations/add-home-screen-mobile-dashboard.migration";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected readonly localStorageService: LocalStorageService;

  protected migrations = [
    inject(AddHomeScreenMobileDashboardSettings)
  ];

  constructor() {
    const localStorageService = inject(LocalStorageService);

    super(localStorageService);

    this.localStorageService = localStorageService;
  }
}
