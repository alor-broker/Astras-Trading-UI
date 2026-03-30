import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { Injectable, inject } from "@angular/core";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected readonly migrationsMetaService: MigrationsMetaService;

  protected migrations = [
    // UpdateBadgesWidgetsSettingsMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesWidgetsSettingsMigration)
  ];

  constructor() {
    const migrationsMetaService = inject(MigrationsMetaService);

    super(migrationsMetaService);

    this.migrationsMetaService = migrationsMetaService;
  }
}
