import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import {
  inject,
  Injectable
} from "@angular/core";
import { UpdateBadgesMobileDashboardMigration } from "./migrations/update-badges-mobile-dashboard.migration";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected migrations = [
    inject(UpdateBadgesMobileDashboardMigration)
  ];

  constructor(localStorageService: LocalStorageService) {
    super(localStorageService);
  }
}
