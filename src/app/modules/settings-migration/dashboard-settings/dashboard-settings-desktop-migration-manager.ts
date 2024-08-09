import { Injectable } from "@angular/core";
import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected migrations = [
    // UpdateBadgesDesktopDashboardMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesDesktopDashboardMigration)
  ];

  constructor(protected readonly migrationsMetaService: MigrationsMetaService) {
    super(migrationsMetaService);
  }
}
