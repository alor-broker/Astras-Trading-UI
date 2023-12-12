import {
  inject,
  Injectable
} from "@angular/core";
import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { UpdateBadgesDesktopDashboardMigration } from "./migrations/update-badges-desktop-dashboard.migration";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected migrations = [
    inject(UpdateBadgesDesktopDashboardMigration)
  ];

  constructor(migrationsMetaService: MigrationsMetaService) {
    super(migrationsMetaService);
  }
}
