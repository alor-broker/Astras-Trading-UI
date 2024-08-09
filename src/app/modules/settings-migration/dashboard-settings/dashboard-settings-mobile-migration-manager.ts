import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected migrations = [
    // UpdateBadgesMobileDashboardMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesMobileDashboardMigration)
  ];

  constructor(protected readonly localStorageService: LocalStorageService) {
    super(localStorageService);
  }
}
