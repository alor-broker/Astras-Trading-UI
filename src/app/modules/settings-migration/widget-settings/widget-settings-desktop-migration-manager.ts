import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { Injectable } from "@angular/core";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected migrations = [
    // UpdateBadgesWidgetsSettingsMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesWidgetsSettingsMigration)
  ];

  constructor(protected readonly migrationsMetaService: MigrationsMetaService) {
    super(migrationsMetaService);
  }
}
