import { Injectable, inject } from "@angular/core";
import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected readonly migrationsMetaService: MigrationsMetaService;

  protected migrations = [
    // UpdateBadgesDesktopDashboardMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesDesktopDashboardMigration)
  ];

  constructor() {
    const migrationsMetaService = inject(MigrationsMetaService);

    super(migrationsMetaService);

    this.migrationsMetaService = migrationsMetaService;
  }
}
